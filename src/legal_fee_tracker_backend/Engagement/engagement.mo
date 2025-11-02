import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Option "mo:base/Option";

// Import other canisters for inter-canister calls
import UserManagement "canister:UserManagement";
import PaymentEscrow "canister:PaymentEscrow";

actor EngagementCanister {
  
  // ==================== TYPE DEFINITIONS ====================
  
  public type EngagementType = {
    #Hourly: { rate: Nat }; // ckUSDC cents per hour
    #FixedFee: { amount: Nat }; // Total ckUSDC cents
    #Milestone: { milestones: [Milestone] };
  };

  public type MilestoneStatus = {
    #Pending;
    #Completed;
    #Approved;
    #Disputed;
    #Paid;
  };

  public type Milestone = {
    id: Nat;
    description: Text;
    amount: Nat; // ckUSDC cents
    status: MilestoneStatus;
    dueDate: ?Int;
    completedAt: ?Int;
  };

  public type TimeEntry = {
    id: Nat;
    lawyerPrincipal: Principal;
    description: Text;
    hours: Float;
    rate: Nat; // ckUSDC cents per hour
    timestamp: Int;
    approved: Bool;
  };

  public type EngagementStatus = {
    #Active;
    #Paused;
    #Completed;
    #Disputed;
    #Cancelled;
  };

  public type Document = {
    id: Nat;
    name: Text;
    contentHash: Text; // SHA-256 hash (encrypted content)
    uploadedBy: Principal;
    timestamp: Int;
    fileSize: Nat;
  };

  public type Message = {
    id: Nat;
    sender: Principal;
    content: Text; // Will be encrypted in VetKeys version
    timestamp: Int;
  };

  public type Engagement = {
    id: Text;
    lawyer: Principal;
    client: Principal;
    engagementType: EngagementType;
    title: Text;
    description: Text;
    status: EngagementStatus;
    escrowAmount: Nat; // Total in escrow
    spentAmount: Nat; // Already paid out
    timeEntries: [TimeEntry];
    documents: [Document];
    messages: [Message];
    createdAt: Int;
    updatedAt: Int;
    completedAt: ?Int;
  };

  public type FeeBreakdown = {
    totalBilled: Nat;
    approved: Nat;
    pending: Nat;
    escrowBalance: Nat;
    hoursLogged: Float;
  };

  public type CreateEngagementArgs = {
    lawyer: Principal;
    client: Principal;
    engagementType: EngagementType;
    title: Text;
    description: Text;
    escrowAmount: Nat;
  };

  // ==================== STATE ====================
  
  private stable var nextEngagementId: Nat = 0;
  private stable var nextTimeEntryId: Nat = 0;
  private stable var nextDocumentId: Nat = 0;
  private stable var nextMessageId: Nat = 0;

  // Stable storage for upgrades
  private stable var engagementsEntries : [(Text, Engagement)] = [];
  private stable var userEngagementsEntries : [(Principal, [Text])] = [];

  // Store engagements
  private var engagements = HashMap.HashMap<Text, Engagement>(
    10, 
    Text.equal, 
    Text.hash
  );

  // Index: Principal -> [EngagementId] for quick lookup
  private var userEngagements = HashMap.HashMap<Principal, [Text]>(
    10,
    Principal.equal,
    Principal.hash
  );

  // Pre-upgrade hook - save state
  system func preupgrade() {
    engagementsEntries := Iter.toArray(engagements.entries());
    userEngagementsEntries := Iter.toArray(userEngagements.entries());
  };

  // Post-upgrade hook - restore state
  system func postupgrade() {
    engagements := HashMap.fromIter<Text, Engagement>(
      engagementsEntries.vals(),
      10,
      Text.equal,
      Text.hash
    );
    userEngagements := HashMap.fromIter<Principal, [Text]>(
      userEngagementsEntries.vals(),
      10,
      Principal.equal,
      Principal.hash
    );
    engagementsEntries := [];
    userEngagementsEntries := [];
  };

  // ==================== HELPER FUNCTIONS ====================

  private func generateEngagementId() : Text {
    let id = "ENG-" # Nat.toText(nextEngagementId);
    nextEngagementId += 1;
    id
  };

  private func isAuthorized(caller: Principal, engagement: Engagement) : Bool {
    caller == engagement.lawyer or caller == engagement.client
  };

  private func addToUserIndex(principal: Principal, engagementId: Text) {
    switch (userEngagements.get(principal)) {
      case null {
        userEngagements.put(principal, [engagementId]);
      };
      case (?existing) {
        userEngagements.put(principal, Array.append(existing, [engagementId]));
      };
    };
  };

  // ==================== PUBLIC FUNCTIONS ====================

  // Create new engagement
  public shared(msg) func createEngagement(args: CreateEngagementArgs) : async Result.Result<Text, Text> {
    // Verify caller is either lawyer or client
    if (msg.caller != args.lawyer and msg.caller != args.client) {
      return #err("Unauthorized: You must be either the lawyer or client");
    };

    let engagementId = generateEngagementId();
    let now = Time.now();

    let newEngagement: Engagement = {
      id = engagementId;
      lawyer = args.lawyer;
      client = args.client;
      engagementType = args.engagementType;
      title = args.title;
      description = args.description;
      status = #Active;
      escrowAmount = args.escrowAmount;
      spentAmount = 0;
      timeEntries = [];
      documents = [];
      messages = [];
      createdAt = now;
      updatedAt = now;
      completedAt = null;
    };

    engagements.put(engagementId, newEngagement);
    
    // Add to indexes
    addToUserIndex(args.lawyer, engagementId);
    addToUserIndex(args.client, engagementId);

    // 🔗 INTER-CANISTER CALL 1: Create escrow account
    let escrowResult = await PaymentEscrow.createEscrowAccount(
      engagementId,
      args.client,
      args.lawyer
    );

    switch (escrowResult) {
      case (#err(e)) {
        // Rollback: remove engagement if escrow creation fails
        engagements.delete(engagementId);
        return #err("Failed to create escrow: " # e);
      };
      case (#ok(_)) {};
    };

    // 🔗 INTER-CANISTER CALL 2: Update user engagement counts
    let _ = await UserManagement.incrementEngagementCount(args.lawyer);
    let _ = await UserManagement.incrementEngagementCount(args.client);

    #ok(engagementId)
  };

  // Get engagement details
  public query(msg) func getEngagement(engagementId: Text) : async Result.Result<Engagement, Text> {
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        if (not isAuthorized(msg.caller, engagement)) {
          return #err("Unauthorized: You are not part of this engagement");
        };
        #ok(engagement)
      };
    };
  };

  // Get all engagements for a user
  public query(msg) func getMyEngagements() : async [Engagement] {
    switch (userEngagements.get(msg.caller)) {
      case null { [] };
      case (?engagementIds) {
        let results = Array.mapFilter<Text, Engagement>(
          engagementIds,
          func(id) {
            engagements.get(id)
          }
        );
        results
      };
    };
  };

  // Add time entry (lawyer only)
  public shared(msg) func addTimeEntry(
    engagementId: Text,
    description: Text,
    hours: Float
  ) : async Result.Result<Nat, Text> {
    
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        // Only lawyer can add time entries
        if (msg.caller != engagement.lawyer) {
          return #err("Unauthorized: Only the lawyer can log time");
        };

        // Only allowed for hourly engagements
        let rate = switch (engagement.engagementType) {
          case (#Hourly(config)) { config.rate };
          case (_) { return #err("Time entries only allowed for hourly engagements") };
        };

        let entryId = nextTimeEntryId;
        nextTimeEntryId += 1;

        let newEntry: TimeEntry = {
          id = entryId;
          lawyerPrincipal = msg.caller;
          description = description;
          hours = hours;
          rate = rate;
          timestamp = Time.now();
          approved = false;
        };

        let updatedEntries = Array.append(engagement.timeEntries, [newEntry]);
        let updatedEngagement = {
          engagement with 
          timeEntries = updatedEntries;
          updatedAt = Time.now();
        };

        engagements.put(engagementId, updatedEngagement);
        #ok(entryId)
      };
    };
  };

  // Approve time entry (client only)
  public shared(msg) func approveTimeEntry(
    engagementId: Text,
    entryId: Nat
  ) : async Result.Result<Text, Text> {
    
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        // Only client can approve
        if (msg.caller != engagement.client) {
          return #err("Unauthorized: Only the client can approve time entries");
        };

        // Find and update the time entry
        let updatedEntries = Array.map<TimeEntry, TimeEntry>(
          engagement.timeEntries,
          func(entry) {
            if (entry.id == entryId) {
              { entry with approved = true }
            } else {
              entry
            }
          }
        );

        // Calculate approved amount
        let entryOpt = Array.find<TimeEntry>(
          engagement.timeEntries,
          func(e) { e.id == entryId }
        );

        switch (entryOpt) {
          case null { return #err("Time entry not found") };
          case (?entry) {
            if (entry.approved) {
              return #err("Time entry already approved");
            };

            let amount = Int.abs(Float.toInt(entry.hours * Float.fromInt(entry.rate)));
            
            let updatedEngagement = {
              engagement with 
              timeEntries = updatedEntries;
              spentAmount = engagement.spentAmount + amount;
              updatedAt = Time.now();
            };

            engagements.put(engagementId, updatedEngagement);
            
            // 🔗 INTER-CANISTER CALL 3: Release payment from escrow
            let paymentResult = await PaymentEscrow.releasePayment(
              engagementId,
              amount,
              "Time entry #" # Nat.toText(entryId) # " approved - " # entry.description
            );

            switch (paymentResult) {
              case (#err(e)) {
                return #err("Time entry approved but payment failed: " # e);
              };
              case (#ok(msg)) {
                #ok("Time entry approved and " # msg)
              };
            }
          };
        };
      };
    };
  };

  // Complete milestone (lawyer only)
  public shared(msg) func completeMilestone(
    engagementId: Text,
    milestoneId: Nat
  ) : async Result.Result<Text, Text> {
    
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        if (msg.caller != engagement.lawyer) {
          return #err("Unauthorized: Only the lawyer can complete milestones");
        };

        let milestones = switch (engagement.engagementType) {
          case (#Milestone(config)) { config.milestones };
          case (_) { return #err("This engagement does not use milestones") };
        };

        let updatedMilestones = Array.map<Milestone, Milestone>(
          milestones,
          func(m) {
            if (m.id == milestoneId and m.status == #Pending) {
              { m with status = #Completed; completedAt = ?Time.now() }
            } else {
              m
            }
          }
        );

        let updatedEngagement = {
          engagement with 
          engagementType = #Milestone({ milestones = updatedMilestones });
          updatedAt = Time.now();
        };

        engagements.put(engagementId, updatedEngagement);
        #ok("Milestone marked as completed")
      };
    };
  };

  // Approve milestone (client only)
  public shared(msg) func approveMilestone(
    engagementId: Text,
    milestoneId: Nat
  ) : async Result.Result<Text, Text> {
    
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        if (msg.caller != engagement.client) {
          return #err("Unauthorized: Only the client can approve milestones");
        };

        let milestones = switch (engagement.engagementType) {
          case (#Milestone(config)) { config.milestones };
          case (_) { return #err("This engagement does not use milestones") };
        };

        var approvedAmount: Nat = 0;
        let updatedMilestones = Array.map<Milestone, Milestone>(
          milestones,
          func(m) {
            if (m.id == milestoneId and m.status == #Completed) {
              approvedAmount := m.amount;
              { m with status = #Approved }
            } else {
              m
            }
          }
        );

        if (approvedAmount == 0) {
          return #err("Milestone not found or not completed");
        };

        let updatedEngagement = {
          engagement with 
          engagementType = #Milestone({ milestones = updatedMilestones });
          spentAmount = engagement.spentAmount + approvedAmount;
          updatedAt = Time.now();
        };

        engagements.put(engagementId, updatedEngagement);
        
        // 🔗 INTER-CANISTER CALL 4: Release milestone payment
        let paymentResult = await PaymentEscrow.releasePayment(
          engagementId,
          approvedAmount,
          "Milestone #" # Nat.toText(milestoneId) # " approved"
        );

        switch (paymentResult) {
          case (#err(e)) {
            return #err("Milestone approved but payment failed: " # e);
          };
          case (#ok(msg)) {
            #ok("Milestone approved and " # msg)
          };
        }
      };
    };
  };

  // Add document
  public shared(msg) func addDocument(
    engagementId: Text,
    name: Text,
    contentHash: Text,
    fileSize: Nat
  ) : async Result.Result<Nat, Text> {
    
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        if (not isAuthorized(msg.caller, engagement)) {
          return #err("Unauthorized");
        };

        let docId = nextDocumentId;
        nextDocumentId += 1;

        let newDoc: Document = {
          id = docId;
          name = name;
          contentHash = contentHash;
          uploadedBy = msg.caller;
          timestamp = Time.now();
          fileSize = fileSize;
        };

        let updatedDocs = Array.append(engagement.documents, [newDoc]);
        let updatedEngagement = {
          engagement with 
          documents = updatedDocs;
          updatedAt = Time.now();
        };

        engagements.put(engagementId, updatedEngagement);
        #ok(docId)
      };
    };
  };

  // Send message
  public shared(msg) func sendMessage(
    engagementId: Text,
    content: Text
  ) : async Result.Result<Nat, Text> {
    
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        if (not isAuthorized(msg.caller, engagement)) {
          return #err("Unauthorized");
        };

        let msgId = nextMessageId;
        nextMessageId += 1;

        let newMessage: Message = {
          id = msgId;
          sender = msg.caller;
          content = content; // In VetKeys version, this would be encrypted
          timestamp = Time.now();
        };

        let updatedMessages = Array.append(engagement.messages, [newMessage]);
        let updatedEngagement = {
          engagement with 
          messages = updatedMessages;
          updatedAt = Time.now();
        };

        engagements.put(engagementId, updatedEngagement);
        #ok(msgId)
      };
    };
  };

  // Calculate current fees
  public query func calculateCurrentFees(engagementId: Text) : async Result.Result<FeeBreakdown, Text> {
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        let breakdown = switch (engagement.engagementType) {
          case (#Hourly(_)) {
            var totalHours: Float = 0;
            var approvedAmount: Nat = 0;
            var pendingAmount: Nat = 0;

            for (entry in engagement.timeEntries.vals()) {
              totalHours += entry.hours;
              let entryAmount = Int.abs(Float.toInt(entry.hours * Float.fromInt(entry.rate)));

              if (entry.approved) {
                approvedAmount += entryAmount;
              } else {
                pendingAmount += entryAmount;
              };
            };

            let escrowBal = if (engagement.escrowAmount >= approvedAmount) {
              engagement.escrowAmount - approvedAmount
            } else { 
              0 
            };

            {
              totalBilled = approvedAmount + pendingAmount;
              approved = approvedAmount;
              pending = pendingAmount;
              escrowBalance = escrowBal;
              hoursLogged = totalHours;
            }
          };

          case (#Milestone(config)) {
            var approved: Nat = 0;
            var pending: Nat = 0;

            for (milestone in config.milestones.vals()) {
              switch (milestone.status) {
                case (#Completed) { pending += milestone.amount };
                case (#Approved or #Paid) { approved += milestone.amount };
                case (_) {};
              };
            };

            let escrowBal = if (engagement.escrowAmount >= approved) {
              engagement.escrowAmount - approved
            } else { 
              0 
            };

            {
              totalBilled = approved + pending;
              approved = approved;
              pending = pending;
              escrowBalance = escrowBal;
              hoursLogged = 0.0;
            }
          };

          case (#FixedFee(config)) {
            let pendingCalc = if (config.amount >= engagement.spentAmount) {
              config.amount - engagement.spentAmount
            } else { 
              0 
            };

            let escrowBal = if (engagement.escrowAmount >= engagement.spentAmount) {
              engagement.escrowAmount - engagement.spentAmount
            } else { 
              0 
            };

            {
              totalBilled = config.amount;
              approved = engagement.spentAmount;
              pending = pendingCalc;
              escrowBalance = escrowBal;
              hoursLogged = 0.0;
            }
          };
        };

        #ok(breakdown)
      };
    };
  };

  // Complete engagement
  public shared(msg) func completeEngagement(engagementId: Text) : async Result.Result<Text, Text> {
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        if (msg.caller != engagement.lawyer and msg.caller != engagement.client) {
          return #err("Unauthorized");
        };

        let updatedEngagement = {
          engagement with 
          status = #Completed;
          completedAt = ?Time.now();
          updatedAt = Time.now();
        };

        engagements.put(engagementId, updatedEngagement);
        
        // 🔗 INTER-CANISTER CALL 5: Update completion counts
        let _ = await UserManagement.markEngagementCompleted(engagement.lawyer);
        let _ = await UserManagement.markEngagementCompleted(engagement.client);

        // 🔗 INTER-CANISTER CALL 6: Refund any remaining escrow balance
        let balanceResult = await PaymentEscrow.getEscrowBalance(engagementId);
        switch (balanceResult) {
          case (#ok(balance)) {
            if (balance > 0) {
              let refundResult = await PaymentEscrow.refundToClient(
                engagementId,
                balance,
                "Engagement completed - refunding unused escrow"
              );
              
              switch (refundResult) {
                case (#ok(_)) {
                  #ok("Engagement completed and " # Nat.toText(balance) # " cents refunded to client")
                };
                case (#err(e)) {
                  #ok("Engagement completed but refund failed: " # e)
                };
              }
            } else {
              #ok("Engagement completed successfully")
            }
          };
          case (#err(_)) {
            #ok("Engagement completed successfully")
          };
        }
      };
    };
  };

  // Get engagement statistics
  public query func getEngagementStats(engagementId: Text) : async Result.Result<Text, Text> {
    switch (engagements.get(engagementId)) {
      case null { #err("Engagement not found") };
      case (?engagement) {
        let stats = "Engagement: " # engagement.title #
                   "\nStatus: " # debug_show(engagement.status) #
                   "\nTime Entries: " # Nat.toText(engagement.timeEntries.size()) #
                   "\nDocuments: " # Nat.toText(engagement.documents.size()) #
                   "\nMessages: " # Nat.toText(engagement.messages.size()) #
                   "\nEscrow: " # Nat.toText(engagement.escrowAmount) # " cents" #
                   "\nSpent: " # Nat.toText(engagement.spentAmount) # " cents";
        #ok(stats)
      };
    };
  };
}
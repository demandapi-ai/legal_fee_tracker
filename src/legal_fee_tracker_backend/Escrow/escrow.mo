import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import Option "mo:base/Option";

persistent actor PaymentEscrow {
  
  // ==================== TYPE DEFINITIONS ====================
  
  public type TransactionType = {
    #Deposit;
    #Release;
    #Refund;
    #Dispute;
  };

  public type Transaction = {
    id: Nat;
    txType: TransactionType;
    amount: Nat; // ckUSDC cents
    from: Principal;
    to: Principal;
    engagementId: Text;
    timestamp: Int;
    blockIndex: ?Nat; // ICRC-1 block index (when integrated)
    memo: Text;
  };

  public type EscrowAccount = {
    engagementId: Text;
    client: Principal;
    lawyer: Principal;
    totalDeposited: Nat;
    totalReleased: Nat;
    totalRefunded: Nat;
    balance: Nat;
    transactions: [Nat]; // Transaction IDs
    createdAt: Int;
    updatedAt: Int;
  };

  public type PaymentRequest = {
    id: Nat;
    engagementId: Text;
    requestedBy: Principal;
    amount: Nat;
    reason: Text;
    status: PaymentRequestStatus;
    createdAt: Int;
  };

  public type PaymentRequestStatus = {
    #Pending;
    #Approved;
    #Rejected;
    #Paid;
  };

  // ==================== STATE ====================
  
  private stable var nextTransactionId: Nat = 0;
  private stable var nextPaymentRequestId: Nat = 0;

  // Stable storage
  private stable var escrowAccountsEntries : [(Text, EscrowAccount)] = [];
  private stable var transactionsEntries : [(Nat, Transaction)] = [];
  private stable var paymentRequestsEntries : [(Nat, PaymentRequest)] = [];
  private stable var userEscrowsEntries : [(Principal, [Text])] = [];

  // Runtime storage (transient - not persisted directly)
  private transient var escrowAccounts = HashMap.HashMap<Text, EscrowAccount>(
    10,
    Text.equal,
    Text.hash
  );

  private transient var transactions = HashMap.HashMap<Nat, Transaction>(
    10,
    Nat.equal,
    func(n: Nat) : Hash.Hash { Text.hash(Nat.toText(n)) }
  );

  private transient var paymentRequests = HashMap.HashMap<Nat, PaymentRequest>(
    10,
    Nat.equal,
    func(n: Nat) : Hash.Hash { Text.hash(Nat.toText(n)) }
  );

  // Index: Principal -> [EngagementIds] for quick lookup
  private transient var userEscrows = HashMap.HashMap<Principal, [Text]>(
    10,
    Principal.equal,
    Principal.hash
  );

  // ==================== UPGRADE HOOKS ====================

  system func preupgrade() {
    escrowAccountsEntries := Iter.toArray(escrowAccounts.entries());
    transactionsEntries := Iter.toArray(transactions.entries());
    paymentRequestsEntries := Iter.toArray(paymentRequests.entries());
    userEscrowsEntries := Iter.toArray(userEscrows.entries());
  };

  system func postupgrade() {
    escrowAccounts := HashMap.fromIter<Text, EscrowAccount>(
      escrowAccountsEntries.vals(),
      10,
      Text.equal,
      Text.hash
    );
    transactions := HashMap.fromIter<Nat, Transaction>(
      transactionsEntries.vals(),
      10,
      Nat.equal,
      func(n: Nat) : Hash.Hash { Text.hash(Nat.toText(n)) }
    );
    paymentRequests := HashMap.fromIter<Nat, PaymentRequest>(
      paymentRequestsEntries.vals(),
      10,
      Nat.equal,
      func(n: Nat) : Hash.Hash { Text.hash(Nat.toText(n)) }
    );
    userEscrows := HashMap.fromIter<Principal, [Text]>(
      userEscrowsEntries.vals(),
      10,
      Principal.equal,
      Principal.hash
    );

    escrowAccountsEntries := [];
    transactionsEntries := [];
    paymentRequestsEntries := [];
    userEscrowsEntries := [];
  };

  // ==================== HELPER FUNCTIONS ====================

  private func addToUserIndex(principal: Principal, engagementId: Text) {
    switch (userEscrows.get(principal)) {
      case null {
        userEscrows.put(principal, [engagementId]);
      };
      case (?existing) {
        userEscrows.put(principal, Array.append(existing, [engagementId]));
      };
    };
  };

  private func createTransaction(
    txType: TransactionType,
    amount: Nat,
    from: Principal,
    to: Principal,
    engagementId: Text,
    memo: Text
  ) : Nat {
    let txId = nextTransactionId;
    nextTransactionId += 1;

    let newTx: Transaction = {
      id = txId;
      txType = txType;
      amount = amount;
      from = from;
      to = to;
      engagementId = engagementId;
      timestamp = Time.now();
      blockIndex = null; // Will be set when ckUSDC integration is added
      memo = memo;
    };

    transactions.put(txId, newTx);
    txId
  };

  // ==================== ESCROW FUNCTIONS ====================

  // Create escrow account for engagement
  public shared(msg) func createEscrowAccount(
    engagementId: Text,
    client: Principal,
    lawyer: Principal
  ) : async Result.Result<Text, Text> {
    // Check if escrow already exists
    switch (escrowAccounts.get(engagementId)) {
      case (?_) { return #err("Escrow account already exists") };
      case null {};
    };

    // Verify caller is either client or lawyer
    if (msg.caller != client and msg.caller != lawyer) {
      return #err("Unauthorized: Only engagement participants can create escrow");
    };

    let now = Time.now();
    let newEscrow: EscrowAccount = {
      engagementId = engagementId;
      client = client;
      lawyer = lawyer;
      totalDeposited = 0;
      totalReleased = 0;
      totalRefunded = 0;
      balance = 0;
      transactions = [];
      createdAt = now;
      updatedAt = now;
    };

    escrowAccounts.put(engagementId, newEscrow);
    
    // Add to indexes
    addToUserIndex(client, engagementId);
    addToUserIndex(lawyer, engagementId);

    #ok("Escrow account created successfully")
  };

  // Deposit to escrow (client only)
  public shared(msg) func depositToEscrow(
    engagementId: Text,
    amount: Nat
  ) : async Result.Result<Text, Text> {
    switch (escrowAccounts.get(engagementId)) {
      case null { #err("Escrow account not found") };
      case (?escrow) {
        // Only client can deposit
        if (msg.caller != escrow.client) {
          return #err("Unauthorized: Only client can deposit to escrow");
        };

        // Create transaction record
        let txId = createTransaction(
          #Deposit,
          amount,
          msg.caller,
          escrow.lawyer,
          engagementId,
          "Deposit to escrow"
        );

        // Update escrow account
        let updatedEscrow = {
          escrow with
          totalDeposited = escrow.totalDeposited + amount;
          balance = escrow.balance + amount;
          transactions = Array.append(escrow.transactions, [txId]);
          updatedAt = Time.now();
        };

        escrowAccounts.put(engagementId, updatedEscrow);

        // Note: In production, this would:
        // 1. Call ckUSDC ledger to transfer from client to escrow canister
        // 2. Store the block index
        // 3. Verify the transfer succeeded

        #ok("Deposited " # Nat.toText(amount) # " cents to escrow. Transaction ID: " # Nat.toText(txId))
      };
    };
  };

  // Release payment to lawyer (triggered by Engagement canister)
  public shared(msg) func releasePayment(
    engagementId: Text,
    amount: Nat,
    reason: Text
  ) : async Result.Result<Text, Text> {
    switch (escrowAccounts.get(engagementId)) {
      case null { #err("Escrow account not found") };
      case (?escrow) {
        // Check if sufficient balance
        if (escrow.balance < amount) {
          return #err("Insufficient escrow balance");
        };

        // Create transaction record
        let txId = createTransaction(
          #Release,
          amount,
          escrow.client,
          escrow.lawyer,
          engagementId,
          reason
        );

        // Update escrow account with safe subtraction
        let newBalance = if (escrow.balance >= amount) {
          escrow.balance - amount
        } else {
          0
        };

        let updatedEscrow = {
          escrow with
          totalReleased = escrow.totalReleased + amount;
          balance = newBalance;
          transactions = Array.append(escrow.transactions, [txId]);
          updatedAt = Time.now();
        };

        escrowAccounts.put(engagementId, updatedEscrow);

        // Note: In production, this would:
        // 1. Call ckUSDC ledger to transfer from escrow to lawyer
        // 2. Store the block index
        // 3. Verify the transfer succeeded

        #ok("Released " # Nat.toText(amount) # " cents to lawyer. Transaction ID: " # Nat.toText(txId))
      };
    };
  };

  // Refund to client
  public shared(msg) func refundToClient(
    engagementId: Text,
    amount: Nat,
    reason: Text
  ) : async Result.Result<Text, Text> {
    switch (escrowAccounts.get(engagementId)) {
      case null { #err("Escrow account not found") };
      case (?escrow) {
        // Only lawyer or client can initiate refund
        if (msg.caller != escrow.lawyer and msg.caller != escrow.client) {
          return #err("Unauthorized");
        };

        // Check if sufficient balance
        if (escrow.balance < amount) {
          return #err("Insufficient escrow balance");
        };

        // Create transaction record
        let txId = createTransaction(
          #Refund,
          amount,
          escrow.lawyer,
          escrow.client,
          engagementId,
          reason
        );

        // Update escrow account
        let newBalance = if (escrow.balance >= amount) {
          escrow.balance - amount
        } else {
          0
        };

        let updatedEscrow = {
          escrow with
          totalRefunded = escrow.totalRefunded + amount;
          balance = newBalance;
          transactions = Array.append(escrow.transactions, [txId]);
          updatedAt = Time.now();
        };

        escrowAccounts.put(engagementId, updatedEscrow);

        #ok("Refunded " # Nat.toText(amount) # " cents to client. Transaction ID: " # Nat.toText(txId))
      };
    };
  };

  // Get escrow balance
  public query func getEscrowBalance(engagementId: Text) : async Result.Result<Nat, Text> {
    switch (escrowAccounts.get(engagementId)) {
      case null { #err("Escrow account not found") };
      case (?escrow) { #ok(escrow.balance) };
    };
  };

  // Get escrow details
  public query(msg) func getEscrowAccount(engagementId: Text) : async Result.Result<EscrowAccount, Text> {
    switch (escrowAccounts.get(engagementId)) {
      case null { #err("Escrow account not found") };
      case (?escrow) {
        // Verify caller is authorized
        if (msg.caller != escrow.client and msg.caller != escrow.lawyer) {
          return #err("Unauthorized");
        };
        #ok(escrow)
      };
    };
  };

  // Get all escrow accounts for user
  public query(msg) func getMyEscrowAccounts() : async [EscrowAccount] {
    switch (userEscrows.get(msg.caller)) {
      case null { [] };
      case (?engagementIds) {
        Array.mapFilter<Text, EscrowAccount>(
          engagementIds,
          func(id) {
            escrowAccounts.get(id)
          }
        )
      };
    };
  };

  // ==================== TRANSACTION FUNCTIONS ====================

  // Get transaction history for engagement
  public query(msg) func getTransactionHistory(engagementId: Text) : async Result.Result<[Transaction], Text> {
    switch (escrowAccounts.get(engagementId)) {
      case null { #err("Escrow account not found") };
      case (?escrow) {
        // Verify caller is authorized
        if (msg.caller != escrow.client and msg.caller != escrow.lawyer) {
          return #err("Unauthorized");
        };

        let txList = Array.mapFilter<Nat, Transaction>(
          escrow.transactions,
          func(txId) {
            transactions.get(txId)
          }
        );
        #ok(txList)
      };
    };
  };

  // Get single transaction
  public query func getTransaction(txId: Nat) : async Result.Result<Transaction, Text> {
    switch (transactions.get(txId)) {
      case null { #err("Transaction not found") };
      case (?tx) { #ok(tx) };
    };
  };

  // ==================== PAYMENT REQUEST FUNCTIONS ====================

  // Create payment request (lawyer requests payment)
  public shared(msg) func createPaymentRequest(
    engagementId: Text,
    amount: Nat,
    reason: Text
  ) : async Result.Result<Nat, Text> {
    switch (escrowAccounts.get(engagementId)) {
      case null { #err("Escrow account not found") };
      case (?escrow) {
        // Only lawyer can create payment requests
        if (msg.caller != escrow.lawyer) {
          return #err("Unauthorized: Only lawyer can request payment");
        };

        let requestId = nextPaymentRequestId;
        nextPaymentRequestId += 1;

        let newRequest: PaymentRequest = {
          id = requestId;
          engagementId = engagementId;
          requestedBy = msg.caller;
          amount = amount;
          reason = reason;
          status = #Pending;
          createdAt = Time.now();
        };

        paymentRequests.put(requestId, newRequest);
        #ok(requestId)
      };
    };
  };

  // Approve payment request (client approves)
  public shared(msg) func approvePaymentRequest(requestId: Nat) : async Result.Result<Text, Text> {
    switch (paymentRequests.get(requestId)) {
      case null { #err("Payment request not found") };
      case (?request) {
        if (request.status != #Pending) {
          return #err("Payment request already processed");
        };

        // Get escrow to verify client
        switch (escrowAccounts.get(request.engagementId)) {
          case null { #err("Escrow account not found") };
          case (?escrow) {
            if (msg.caller != escrow.client) {
              return #err("Unauthorized: Only client can approve payment");
            };

            // Update request status
            let updatedRequest = {
              request with status = #Approved;
            };
            paymentRequests.put(requestId, updatedRequest);

            // Release payment
            let releaseResult = await releasePayment(
              request.engagementId,
              request.amount,
              request.reason
            );

            switch (releaseResult) {
              case (#ok(msg)) {
                // Mark as paid
                let paidRequest = {
                  request with status = #Paid;
                };
                paymentRequests.put(requestId, paidRequest);
                #ok(msg)
              };
              case (#err(e)) { #err(e) };
            }
          };
        };
      };
    };
  };

  // Reject payment request
  public shared(msg) func rejectPaymentRequest(requestId: Nat) : async Result.Result<Text, Text> {
    switch (paymentRequests.get(requestId)) {
      case null { #err("Payment request not found") };
      case (?request) {
        if (request.status != #Pending) {
          return #err("Payment request already processed");
        };

        // Get escrow to verify client
        switch (escrowAccounts.get(request.engagementId)) {
          case null { #err("Escrow account not found") };
          case (?escrow) {
            if (msg.caller != escrow.client) {
              return #err("Unauthorized: Only client can reject payment");
            };

            // Update request status
            let updatedRequest = {
              request with status = #Rejected;
            };
            paymentRequests.put(requestId, updatedRequest);
            #ok("Payment request rejected")
          };
        };
      };
    };
  };

  // Get payment requests for engagement
  public query func getPaymentRequests(engagementId: Text) : async [PaymentRequest] {
    let allRequests = Iter.toArray(paymentRequests.vals());
    Array.filter<PaymentRequest>(
      allRequests,
      func(req) { req.engagementId == engagementId }
    )
  };

  // ==================== STATS ====================

  public query func getStats() : async Text {
    let escrowCount = escrowAccounts.size();
    let txCount = transactions.size();
    
    var totalDeposited: Nat = 0;
    var totalReleased: Nat = 0;
    var totalBalance: Nat = 0;

    for (escrow in escrowAccounts.vals()) {
      totalDeposited += escrow.totalDeposited;
      totalReleased += escrow.totalReleased;
      totalBalance += escrow.balance;
    };

    "Total Escrow Accounts: " # Nat.toText(escrowCount) #
    "\nTotal Transactions: " # Nat.toText(txCount) #
    "\nTotal Deposited: " # Nat.toText(totalDeposited) # " cents ($" # Nat.toText(totalDeposited / 100) # ")" #
    "\nTotal Released: " # Nat.toText(totalReleased) # " cents ($" # Nat.toText(totalReleased / 100) # ")" #
    "\nTotal Balance in Escrow: " # Nat.toText(totalBalance) # " cents ($" # Nat.toText(totalBalance / 100) # ")"
  };
}
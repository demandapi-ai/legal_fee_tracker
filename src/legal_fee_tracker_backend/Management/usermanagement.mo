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
import Option "mo:base/Option";

persistent actor UserManagement {
  
  // ==================== TYPE DEFINITIONS ====================
  
  public type UserType = {
    #Lawyer;
    #Client;
    #Both;
  };

  public type LawyerProfile = {
    principal: Principal;
    name: Text;
    email: Text;
    jurisdiction: Text;
    specializations: [Text];
    hourlyRate: ?Nat; // ckUSDC cents per hour
    bio: Text;
    verified: Bool;
    totalEngagements: Nat;
    completedEngagements: Nat;
    rating: Float;
    reviewCount: Nat;
    walletAddress: Text;
    createdAt: Int;
    updatedAt: Int;
  };

  public type ClientProfile = {
    principal: Principal;
    name: Text;
    email: Text;
    totalEngagements: Nat;
    completedEngagements: Nat;
    rating: Float;
    reviewCount: Nat;
    walletAddress: Text;
    createdAt: Int;
    updatedAt: Int;
  };

  public type Review = {
    id: Nat;
    reviewerPrincipal: Principal;
    revieweePrincipal: Principal;
    engagementId: Text;
    rating: Nat; // 1-5 stars
    comment: Text;
    timestamp: Int;
  };

  public type LawyerSearchFilters = {
    specialization: ?Text;
    minRate: ?Nat;
    maxRate: ?Nat;
    jurisdiction: ?Text;
    minRating: ?Float;
  };

  public type CreateLawyerProfileArgs = {
    name: Text;
    email: Text;
    jurisdiction: Text;
    specializations: [Text];
    hourlyRate: ?Nat;
    bio: Text;
    walletAddress: Text;
  };

  public type CreateClientProfileArgs = {
    name: Text;
    email: Text;
    walletAddress: Text;
  };

  // ==================== STATE ====================
  
  private stable var nextReviewId: Nat = 0;
  
  // Stable storage - these persist across upgrades
  private stable var lawyerProfilesEntries : [(Principal, LawyerProfile)] = [];
  private stable var clientProfilesEntries : [(Principal, ClientProfile)] = [];
  private stable var reviewsEntries : [(Nat, Review)] = [];
  
  // Helper function for Nat hash
  private func natHash(n: Nat) : Hash.Hash {
    Text.hash(Nat.toText(n))
  };
  
  // Runtime storage - marked as transient
  private transient var lawyerProfiles = HashMap.HashMap<Principal, LawyerProfile>(
    10,
    Principal.equal,
    Principal.hash
  );

  private transient var clientProfiles = HashMap.HashMap<Principal, ClientProfile>(
    10,
    Principal.equal,
    Principal.hash
  );

  private transient var reviews = HashMap.HashMap<Nat, Review>(
    10,
    Nat.equal,
    natHash
  );

  // Index: reviewee -> [reviewIds]
  private transient var reviewsByUser = HashMap.HashMap<Principal, [Nat]>(
    10,
    Principal.equal,
    Principal.hash
  );

  // ==================== UPGRADE HOOKS ====================

  system func preupgrade() {
    lawyerProfilesEntries := Iter.toArray(lawyerProfiles.entries());
    clientProfilesEntries := Iter.toArray(clientProfiles.entries());
    reviewsEntries := Iter.toArray(reviews.entries());
  };

  system func postupgrade() {
    lawyerProfiles := HashMap.fromIter<Principal, LawyerProfile>(
      lawyerProfilesEntries.vals(),
      10,
      Principal.equal,
      Principal.hash
    );
    clientProfiles := HashMap.fromIter<Principal, ClientProfile>(
      clientProfilesEntries.vals(),
      10,
      Principal.equal,
      Principal.hash
    );
    reviews := HashMap.fromIter<Nat, Review>(
      reviewsEntries.vals(),
      10,
      Nat.equal,
      natHash
    );
    
    // Rebuild the reviewsByUser index
    for ((reviewId, review) in reviews.entries()) {
      switch (reviewsByUser.get(review.revieweePrincipal)) {
        case null {
          reviewsByUser.put(review.revieweePrincipal, [reviewId]);
        };
        case (?existing) {
          reviewsByUser.put(review.revieweePrincipal, Array.append(existing, [reviewId]));
        };
      };
    };
    
    lawyerProfilesEntries := [];
    clientProfilesEntries := [];
    reviewsEntries := [];
  };

  // ==================== HELPER FUNCTIONS ====================

  private func calculateAverageRating(userPrincipal: Principal) : (Float, Nat) {
    switch (reviewsByUser.get(userPrincipal)) {
      case null { (0.0, 0) };
      case (?reviewIds) {
        var totalRating: Nat = 0;
        var count: Nat = 0;
        
        for (reviewId in reviewIds.vals()) {
          switch (reviews.get(reviewId)) {
            case (?review) {
              totalRating += review.rating;
              count += 1;
            };
            case null {};
          };
        };
        
        if (count == 0) {
          (0.0, 0)
        } else {
          (Float.fromInt(totalRating) / Float.fromInt(count), count)
        }
      };
    };
  };

  // ==================== LAWYER FUNCTIONS ====================

  // Register as lawyer
  public shared(msg) func registerLawyer(args: CreateLawyerProfileArgs) : async Result.Result<Text, Text> {
    // Check if already registered
    switch (lawyerProfiles.get(msg.caller)) {
      case (?_) { return #err("Lawyer profile already exists") };
      case null {};
    };

    let now = Time.now();
    let newProfile: LawyerProfile = {
      principal = msg.caller;
      name = args.name;
      email = args.email;
      jurisdiction = args.jurisdiction;
      specializations = args.specializations;
      hourlyRate = args.hourlyRate;
      bio = args.bio;
      verified = false;
      totalEngagements = 0;
      completedEngagements = 0;
      rating = 0.0;
      reviewCount = 0;
      walletAddress = args.walletAddress;
      createdAt = now;
      updatedAt = now;
    };

    lawyerProfiles.put(msg.caller, newProfile);
    #ok("Lawyer profile created successfully")
  };

  // Get lawyer profile
  public query func getLawyerProfile(principal: Principal) : async Result.Result<LawyerProfile, Text> {
    switch (lawyerProfiles.get(principal)) {
      case null { #err("Lawyer profile not found") };
      case (?profile) { #ok(profile) };
    };
  };

  // Update lawyer profile
  public shared(msg) func updateLawyerProfile(
    name: ?Text,
    email: ?Text,
    jurisdiction: ?Text,
    specializations: ?[Text],
    hourlyRate: ??Nat,
    bio: ?Text
  ) : async Result.Result<Text, Text> {
    switch (lawyerProfiles.get(msg.caller)) {
      case null { #err("Lawyer profile not found") };
      case (?profile) {
        let updatedProfile: LawyerProfile = {
          principal = profile.principal;
          name = Option.get(name, profile.name);
          email = Option.get(email, profile.email);
          jurisdiction = Option.get(jurisdiction, profile.jurisdiction);
          specializations = Option.get(specializations, profile.specializations);
          hourlyRate = Option.get(hourlyRate, profile.hourlyRate);
          bio = Option.get(bio, profile.bio);
          verified = profile.verified;
          totalEngagements = profile.totalEngagements;
          completedEngagements = profile.completedEngagements;
          rating = profile.rating;
          reviewCount = profile.reviewCount;
          walletAddress = profile.walletAddress;
          createdAt = profile.createdAt;
          updatedAt = Time.now();
        };
        
        lawyerProfiles.put(msg.caller, updatedProfile);
        #ok("Profile updated successfully")
      };
    };
  };

  // Search lawyers
  public query func searchLawyers(filters: LawyerSearchFilters) : async [LawyerProfile] {
    let allLawyers = Iter.toArray(lawyerProfiles.vals());
    
    Array.filter<LawyerProfile>(
      allLawyers,
      func(lawyer) {
        // Filter by specialization
        let specMatch = switch (filters.specialization) {
          case null { true };
          case (?spec) {
            Option.isSome(
              Array.find<Text>(
                lawyer.specializations,
                func(s) { Text.contains(s, #text spec) }
              )
            )
          };
        };

        // Filter by rate range
        let rateMatch = switch (lawyer.hourlyRate) {
          case null { true };
          case (?rate) {
            let minMatch = switch (filters.minRate) {
              case null { true };
              case (?minRate) { rate >= minRate };
            };
            let maxMatch = switch (filters.maxRate) {
              case null { true };
              case (?maxRate) { rate <= maxRate };
            };
            minMatch and maxMatch
          };
        };

        // Filter by jurisdiction
        let jurisdictionMatch = switch (filters.jurisdiction) {
          case null { true };
          case (?jur) { Text.contains(lawyer.jurisdiction, #text jur) };
        };

        // Filter by rating
        let ratingMatch = switch (filters.minRating) {
          case null { true };
          case (?minRating) { lawyer.rating >= minRating };
        };

        specMatch and rateMatch and jurisdictionMatch and ratingMatch
      }
    )
  };

  // Get all lawyers (for browsing)
  public query func getAllLawyers() : async [LawyerProfile] {
    Iter.toArray(lawyerProfiles.vals())
  };

  // ==================== CLIENT FUNCTIONS ====================

  // Register as client
  public shared(msg) func registerClient(args: CreateClientProfileArgs) : async Result.Result<Text, Text> {
    // Check if already registered
    switch (clientProfiles.get(msg.caller)) {
      case (?_) { return #err("Client profile already exists") };
      case null {};
    };

    let now = Time.now();
    let newProfile: ClientProfile = {
      principal = msg.caller;
      name = args.name;
      email = args.email;
      totalEngagements = 0;
      completedEngagements = 0;
      rating = 0.0;
      reviewCount = 0;
      walletAddress = args.walletAddress;
      createdAt = now;
      updatedAt = now;
    };

    clientProfiles.put(msg.caller, newProfile);
    #ok("Client profile created successfully")
  };

  // Get client profile
  public query func getClientProfile(principal: Principal) : async Result.Result<ClientProfile, Text> {
    switch (clientProfiles.get(principal)) {
      case null { #err("Client profile not found") };
      case (?profile) { #ok(profile) };
    };
  };

  // Update client profile
  public shared(msg) func updateClientProfile(
    name: ?Text,
    email: ?Text
  ) : async Result.Result<Text, Text> {
    switch (clientProfiles.get(msg.caller)) {
      case null { #err("Client profile not found") };
      case (?profile) {
        let updatedProfile: ClientProfile = {
          principal = profile.principal;
          name = Option.get(name, profile.name);
          email = Option.get(email, profile.email);
          totalEngagements = profile.totalEngagements;
          completedEngagements = profile.completedEngagements;
          rating = profile.rating;
          reviewCount = profile.reviewCount;
          walletAddress = profile.walletAddress;
          createdAt = profile.createdAt;
          updatedAt = Time.now();
        };
        
        clientProfiles.put(msg.caller, updatedProfile);
        #ok("Profile updated successfully")
      };
    };
  };

  // ==================== USER TYPE FUNCTIONS ====================

  // Check what type of user
  public query func getUserType(principal: Principal) : async UserType {
    let isLawyer = Option.isSome(lawyerProfiles.get(principal));
    let isClient = Option.isSome(clientProfiles.get(principal));

    if (isLawyer and isClient) {
      #Both
    } else if (isLawyer) {
      #Lawyer
    } else if (isClient) {
      #Client
    } else {
      #Client // Default to client if no profile
    }
  };

  // Get my profile (auto-detect type)
  public shared(msg) func getMyProfile() : async Result.Result<Text, Text> {
    let lawyerOpt = lawyerProfiles.get(msg.caller);
    let clientOpt = clientProfiles.get(msg.caller);

    switch (lawyerOpt, clientOpt) {
      case (?lawyer, ?client) {
        #ok("Both lawyer and client profiles exist")
      };
      case (?lawyer, null) {
        #ok("Lawyer profile exists")
      };
      case (null, ?client) {
        #ok("Client profile exists")
      };
      case (null, null) {
        #err("No profile found. Please register first.")
      };
    }
  };

  // ==================== REVIEW FUNCTIONS ====================

  // Add review
  public shared(msg) func addReview(
    revieweePrincipal: Principal,
    engagementId: Text,
    rating: Nat,
    comment: Text
  ) : async Result.Result<Nat, Text> {
    // Validate rating (1-5 stars)
    if (rating < 1 or rating > 5) {
      return #err("Rating must be between 1 and 5");
    };

    // Check if reviewee exists
    let revieweeExists = Option.isSome(lawyerProfiles.get(revieweePrincipal)) or 
                        Option.isSome(clientProfiles.get(revieweePrincipal));
    if (not revieweeExists) {
      return #err("Reviewee not found");
    };

    let reviewId = nextReviewId;
    nextReviewId += 1;

    let newReview: Review = {
      id = reviewId;
      reviewerPrincipal = msg.caller;
      revieweePrincipal = revieweePrincipal;
      engagementId = engagementId;
      rating = rating;
      comment = comment;
      timestamp = Time.now();
    };

    reviews.put(reviewId, newReview);

    // Update index
    switch (reviewsByUser.get(revieweePrincipal)) {
      case null {
        reviewsByUser.put(revieweePrincipal, [reviewId]);
      };
      case (?existing) {
        reviewsByUser.put(revieweePrincipal, Array.append(existing, [reviewId]));
      };
    };

    // Update average rating for reviewee
    let (avgRating, reviewCount) = calculateAverageRating(revieweePrincipal);
    
    // Update lawyer profile if they are a lawyer
    switch (lawyerProfiles.get(revieweePrincipal)) {
      case (?profile) {
        let updated = {
          profile with
          rating = avgRating;
          reviewCount = reviewCount;
          updatedAt = Time.now();
        };
        lawyerProfiles.put(revieweePrincipal, updated);
      };
      case null {};
    };

    // Update client profile if they are a client
    switch (clientProfiles.get(revieweePrincipal)) {
      case (?profile) {
        let updated = {
          profile with
          rating = avgRating;
          reviewCount = reviewCount;
          updatedAt = Time.now();
        };
        clientProfiles.put(revieweePrincipal, updated);
      };
      case null {};
    };

    #ok(reviewId)
  };

  // Get reviews for a user
  public query func getReviewsForUser(principal: Principal) : async [Review] {
    switch (reviewsByUser.get(principal)) {
      case null { [] };
      case (?reviewIds) {
        Array.mapFilter<Nat, Review>(
          reviewIds,
          func(id) {
            reviews.get(id)
          }
        )
      };
    };
  };

  // ==================== ENGAGEMENT TRACKING (Called by Engagement Canister) ====================

  // Increment engagement count
  public shared(msg) func incrementEngagementCount(userPrincipal: Principal) : async Result.Result<Text, Text> {
    // Update lawyer profile
    switch (lawyerProfiles.get(userPrincipal)) {
      case (?profile) {
        let updated = {
          profile with
          totalEngagements = profile.totalEngagements + 1;
          updatedAt = Time.now();
        };
        lawyerProfiles.put(userPrincipal, updated);
      };
      case null {};
    };

    // Update client profile
    switch (clientProfiles.get(userPrincipal)) {
      case (?profile) {
        let updated = {
          profile with
          totalEngagements = profile.totalEngagements + 1;
          updatedAt = Time.now();
        };
        clientProfiles.put(userPrincipal, updated);
      };
      case null {};
    };

    #ok("Engagement count incremented")
  };

  // Mark engagement as completed
  public shared(msg) func markEngagementCompleted(userPrincipal: Principal) : async Result.Result<Text, Text> {
    // Update lawyer profile
    switch (lawyerProfiles.get(userPrincipal)) {
      case (?profile) {
        let updated = {
          profile with
          completedEngagements = profile.completedEngagements + 1;
          updatedAt = Time.now();
        };
        lawyerProfiles.put(userPrincipal, updated);
      };
      case null {};
    };

    // Update client profile
    switch (clientProfiles.get(userPrincipal)) {
      case (?profile) {
        let updated = {
          profile with
          completedEngagements = profile.completedEngagements + 1;
          updatedAt = Time.now();
        };
        clientProfiles.put(userPrincipal, updated);
      };
      case null {};
    };

    #ok("Completed engagement count incremented")
  };

  // ==================== STATS ====================

  public query func getStats() : async Text {
    let lawyerCount = lawyerProfiles.size();
    let clientCount = clientProfiles.size();
    let reviewCount = reviews.size();

    "Total Lawyers: " # Nat.toText(lawyerCount) #
    "\nTotal Clients: " # Nat.toText(clientCount) #
    "\nTotal Reviews: " # Nat.toText(reviewCount)
  };
}
# Complete Legal Fee Tracker - Setup & Integration Guide

## Project Structure

Create the following directory structure:

```
legal_fee_tracker/
├── dfx.json
├── package.json
├── src/
│   ├── legal_fee_tracker_backend/
│   │   ├── UserManagement/
│   │   │   └── user_management.mo
│   │   ├── Engagement/
│   │   │   └── engagement.mo
│   │   └── PaymentEscrow/
│   │       └── payment_escrow.mo
│   └── legal_fee_tracker_frontend/
│       └── (React app files)
```

## Step 1: Setup Project Structure

```bash
# Navigate to your project
cd legal_fee_tracker

# Create backend directories
mkdir -p src/legal_fee_tracker_backend/UserManagement
mkdir -p src/legal_fee_tracker_backend/Engagement
mkdir -p src/legal_fee_tracker_backend/PaymentEscrow

# Copy the canister code into respective files
# user_management.mo -> src/legal_fee_tracker_backend/UserManagement/user_management.mo
# engagement.mo -> src/legal_fee_tracker_backend/Engagement/engagement.mo
# payment_escrow.mo -> src/legal_fee_tracker_backend/PaymentEscrow/payment_escrow.mo
```

## Step 2: Update dfx.json

Replace your `dfx.json` with the configuration from the artifact above.

## Step 3: Deploy All Canisters

```bash
# Start dfx
dfx start --clean --background

# Deploy Internet Identity first
dfx deploy internet_identity

# Deploy all backend canisters
dfx deploy UserManagement
dfx deploy PaymentEscrow
dfx deploy Engagement

# Deploy frontend
npm install
dfx deploy legal_fee_tracker_frontend

# Or deploy all at once
dfx deploy
```

## Step 4: Get Canister IDs

```bash
# Save these for later use
dfx canister id UserManagement
dfx canister id Engagement
dfx canister id PaymentEscrow
dfx canister id internet_identity
```

## Integration Testing

### Test 1: Complete User Registration Flow

```bash
# Create two test identities
dfx identity new lawyer_alice
dfx identity new client_bob

# Get principals
dfx identity use lawyer_alice
LAWYER_PRINCIPAL=$(dfx identity get-principal)
echo "Lawyer: $LAWYER_PRINCIPAL"

dfx identity use client_bob
CLIENT_PRINCIPAL=$(dfx identity get-principal)
echo "Client: $CLIENT_PRINCIPAL"

# Register lawyer
dfx identity use lawyer_alice
dfx canister call UserManagement registerLawyer '(
  record {
    name = "Alice Johnson";
    email = "alice@lawfirm.com";
    jurisdiction = "New York";
    specializations = vec { "Contract Law"; "Employment Law" };
    hourlyRate = opt (25000 : nat);
    bio = "Experienced contract lawyer with 10 years practice";
    walletAddress = "ckusdc-wallet-alice-123";
  }
)'

# Register client
dfx identity use client_bob
dfx canister call UserManagement registerClient '(
  record {
    name = "Bob Smith";
    email = "bob@company.com";
    walletAddress = "ckusdc-wallet-bob-456";
  }
)'

# Verify registrations
dfx canister call UserManagement getLawyerProfile "(principal \"$LAWYER_PRINCIPAL\")"
dfx canister call UserManagement getClientProfile "(principal \"$CLIENT_PRINCIPAL\")"
```

### Test 2: Create Engagement with All Three Canisters

```bash
# Step 1: Client creates engagement
dfx identity use client_bob

dfx canister call Engagement createEngagement '(
  record {
    lawyer = principal "'$LAWYER_PRINCIPAL'";
    client = principal "'$CLIENT_PRINCIPAL'";
    engagementType = variant {
      Hourly = record { rate = 25000 : nat }
    };
    title = "Employment Contract Review";
    description = "Review and negotiate employment agreement";
    escrowAmount = 500000 : nat;
  }
)'

# Output: (variant { ok = "ENG-0" })

# Step 2: Create escrow account for this engagement
dfx canister call PaymentEscrow createEscrowAccount '(
  "ENG-0",
  principal "'$CLIENT_PRINCIPAL'",
  principal "'$LAWYER_PRINCIPAL'"
)'

# Output: (variant { ok = "Escrow account created successfully" })

# Step 3: Client deposits funds to escrow
dfx canister call PaymentEscrow depositToEscrow '(
  "ENG-0",
  500000 : nat
)'

# Output: (variant { ok = "Deposited 500000 cents to escrow..." })

# Step 4: Update user engagement counts
dfx canister call UserManagement incrementEngagementCount "(principal \"$LAWYER_PRINCIPAL\")"
dfx canister call UserManagement incrementEngagementCount "(principal \"$CLIENT_PRINCIPAL\")"
```

### Test 3: Complete Work Flow (Time Tracking → Approval → Payment)

```bash
# Step 1: Lawyer logs time
dfx identity use lawyer_alice

dfx canister call Engagement addTimeEntry '(
  "ENG-0",
  "Initial consultation and contract review - identified 3 key issues",
  2.5 : float64
)'

# Output: (variant { ok = 0 : nat })  <- Time entry ID

# Step 2: Check current fees
dfx canister call Engagement calculateCurrentFees '("ENG-0")'

# Output shows:
# - totalBilled: 62500 (2.5 hrs × $250)
# - approved: 0
# - pending: 62500
# - escrowBalance: 500000

# Step 3: Client approves time entry
dfx identity use client_bob

dfx canister call Engagement approveTimeEntry '(
  "ENG-0",
  0 : nat
)'

# Output: (variant { ok = "Time entry approved - payment of 62500 cents released" })

# Step 4: Release payment from escrow
dfx canister call PaymentEscrow releasePayment '(
  "ENG-0",
  62500 : nat,
  "Payment for time entry #0 - 2.5 hours"
)'

# Output: (variant { ok = "Released 62500 cents to lawyer..." })

# Step 5: Verify escrow balance
dfx canister call PaymentEscrow getEscrowBalance '("ENG-0")'

# Output: (variant { ok = 437500 : nat })  <- $5000 - $625 = $4375
```

### Test 4: Milestone-Based Engagement

```bash
dfx identity use client_bob

# Create milestone engagement
dfx canister call Engagement createEngagement '(
  record {
    lawyer = principal "'$LAWYER_PRINCIPAL'";
    client = principal "'$CLIENT_PRINCIPAL'";
    engagementType = variant {
      Milestone = record {
        milestones = vec {
          record {
            id = 0 : nat;
            description = "Initial case assessment";
            amount = 200000 : nat;
            status = variant { Pending };
            dueDate = null;
            completedAt = null;
          };
          record {
            id = 1 : nat;
            description = "Draft legal documents";
            amount = 300000 : nat;
            status = variant { Pending };
            dueDate = null;
            completedAt = null;
          };
        }
      }
    };
    title = "Business Formation Case";
    description = "Form LLC and draft operating agreement";
    escrowAmount = 500000 : nat;
  }
)'

# Output: (variant { ok = "ENG-1" })

# Create escrow
dfx canister call PaymentEscrow createEscrowAccount '(
  "ENG-1",
  principal "'$CLIENT_PRINCIPAL'",
  principal "'$LAWYER_PRINCIPAL'"
)'

# Deposit funds
dfx canister call PaymentEscrow depositToEscrow '(
  "ENG-1",
  500000 : nat
)'

# Lawyer completes milestone
dfx identity use lawyer_alice
dfx canister call Engagement completeMilestone '(
  "ENG-1",
  0 : nat
)'

# Client approves milestone
dfx identity use client_bob
dfx canister call Engagement approveMilestone '(
  "ENG-1",
  0 : nat
)'

# Release payment
dfx canister call PaymentEscrow releasePayment '(
  "ENG-1",
  200000 : nat,
  "Milestone 0 completed: Initial case assessment"
)'
```

### Test 5: Messaging & Documents

```bash
# Add encrypted message
dfx identity use client_bob
dfx canister call Engagement sendMessage '(
  "ENG-0",
  "Hi Alice, I have a question about clause 3.2 in the contract."
)'

# Lawyer responds
dfx identity use lawyer_alice
dfx canister call Engagement sendMessage '(
  "ENG-0",
  "Hi Bob, that clause covers non-compete terms. Let me explain..."
)'

# Add document
dfx canister call Engagement addDocument '(
  "ENG-0",
  "Contract_Draft_v2.pdf",
  "sha256:abc123def456...",
  245800 : nat
)'
```

### Test 6: Reviews & Reputation

```bash
# Client reviews lawyer after engagement completes
dfx identity use client_bob

dfx canister call UserManagement addReview '(
  principal "'$LAWYER_PRINCIPAL'",
  "ENG-0",
  5 : nat,
  "Excellent service! Very thorough and responsive."
)'

# Mark engagement as completed
dfx canister call Engagement completeEngagement '("ENG-0")'

# Update completion counts
dfx canister call UserManagement markEngagementCompleted "(principal \"$LAWYER_PRINCIPAL\")"
dfx canister call UserManagement markEngagementCompleted "(principal \"$CLIENT_PRINCIPAL\")"

# Check updated lawyer profile with rating
dfx canister call UserManagement getLawyerProfile "(principal \"$LAWYER_PRINCIPAL\")"
```

### Test 7: Search & Discovery

```bash
# Search for lawyers by specialization
dfx canister call UserManagement searchLawyers '(
  record {
    specialization = opt "Contract Law";
    minRate = null;
    maxRate = opt (30000 : nat);
    jurisdiction = null;
    minRating = null;
  }
)'

# Get all lawyers
dfx canister call UserManagement getAllLawyers '()'

# Get user type
dfx canister call UserManagement getUserType "(principal \"$LAWYER_PRINCIPAL\")"
```

### Test 8: Transaction History

```bash
# Get escrow account details
dfx identity use client_bob
dfx canister call PaymentEscrow getEscrowAccount '("ENG-0")'

# Get transaction history
dfx canister call PaymentEscrow getTransactionHistory '("ENG-0")'

# Get my escrow accounts
dfx canister call PaymentEscrow getMyEscrowAccounts '()'
```

### Test 9: Payment Requests (Alternative Flow)

```bash
# Lawyer creates payment request instead of automatic approval
dfx identity use lawyer_alice

dfx canister call PaymentEscrow createPaymentRequest '(
  "ENG-0",
  50000 : nat,
  "Additional research and consultation - 2 hours"
)'

# Output: (variant { ok = 0 : nat })  <- Request ID

# Client reviews and approves
dfx identity use client_bob

dfx canister call PaymentEscrow approvePaymentRequest '(0 : nat)'

# Or client rejects
# dfx canister call PaymentEscrow rejectPaymentRequest '(0 : nat)'
```

### Test 10: Get Statistics

```bash
# User Management stats
dfx canister call UserManagement getStats '()'

# Payment Escrow stats
dfx canister call PaymentEscrow getStats '()'

# Engagement stats
dfx canister call Engagement getEngagementStats '("ENG-0")'
```

## Complete Integration Flow Diagram

```
1. User Registration
   ├─> UserManagement.registerLawyer()
   └─> UserManagement.registerClient()

2. Engagement Creation
   ├─> Engagement.createEngagement()
   ├─> PaymentEscrow.createEscrowAccount()
   ├─> PaymentEscrow.depositToEscrow()
   └─> UserManagement.incrementEngagementCount()

3. Work & Payment Cycle
   ├─> Engagement.addTimeEntry() [Lawyer]
   ├─> Engagement.approveTimeEntry() [Client]
   └─> PaymentEscrow.releasePayment()

4. Completion & Review
   ├─> Engagement.completeEngagement()
   ├─> PaymentEscrow.refundToClient() [if balance remains]
   ├─> UserManagement.markEngagementCompleted()
   └─> UserManagement.addReview()
```

## Canister Communication Summary

### UserManagement ↔ Other Canisters
- **Called by Engagement**: `incrementEngagementCount()`, `markEngagementCompleted()`
- **Provides to Frontend**: User profiles, search, reviews

### Engagement ↔ Other Canisters
- **Calls UserManagement**: When engagement created/completed
- **Calls PaymentEscrow**: When payments need to be released
- **Provides to Frontend**: Engagement details, time entries, milestones

### PaymentEscrow ↔ Other Canisters
- **Called by Engagement**: `releasePayment()` after approvals
- **Called by Client**: `depositToEscrow()`
- **Provides to Frontend**: Balance info, transaction history

## Advanced: Making Canisters Call Each Other

To enable inter-canister calls, update the Engagement canister:

```motoko
// At the top of engagement.mo
import UserManagement "canister:UserManagement";
import PaymentEscrow "canister:PaymentEscrow";

// When creating engagement
public shared(msg) func createEngagement(args: CreateEngagementArgs) : async Result.Result<Text, Text> {
  // ... existing code ...
  
  // Notify UserManagement
  let _ = await UserManagement.incrementEngagementCount(args.lawyer);
  let _ = await UserManagement.incrementEngagementCount(args.client);
  
  // Create escrow account
  let escrowResult = await PaymentEscrow.createEscrowAccount(
    engagementId,
    args.client,
    args.lawyer
  );
  
  // ... rest of code ...
};

// When approving time entry
public shared(msg) func approveTimeEntry(engagementId: Text, entryId: Nat) : async Result.Result<Text, Text> {
  // ... existing code ...
  
  // Release payment from escrow
  let releaseResult = await PaymentEscrow.releasePayment(
    engagementId,
    amount,
    "Time entry #" # Nat.toText(entryId) # " approved"
  );
  
  // ... rest of code ...
};
```

## Troubleshooting

### Issue: "Cannot find canister"
```bash
# Make sure all canisters are deployed
dfx deploy --all
```

### Issue: "Unauthorized" errors
```bash
# Check which identity you're using
dfx identity whoami

# Switch to correct identity
dfx identity use lawyer_alice  # or client_bob
```

### Issue: Canisters can't call each other
```bash
# Redeploy with dependencies
dfx deploy Engagement
```

## Next Steps

1. ✅ **Test all three canisters** working together
2. 🔐 **Add VetKeys encryption** to Engagement canister
3. 💰 **Integrate real ckUSDC** in PaymentEscrow canister
4. 🎨 **Build React frontend** to interact with all canisters
5. 🚀 **Deploy to IC mainnet**

All three canisters are now working together! Ready to build the frontend? 🚀
# ICP Legal Fee Tracker - Technical Architecture

## Overview
A permissionless legal fee tracking platform built on Internet Computer Protocol (ICP) that enables transparent, trustless engagement tracking between lawyers and clients using ckUSDC for payments.

## Core Technology Stack

### Authentication
- **Internet Identity**: Decentralized authentication for both lawyers and clients
- No email/password required
- Privacy-preserving (pseudonymous principals)
- Secure cross-device authentication

### Payment Infrastructure
- **ckUSDC**: Chain-key USDC for stable, low-cost payments
- **ICP Ledger**: For potential ICP token payments/rewards
- Smart contract escrow for fund security

### Canisters Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Frontend Canister                    │
│              (React/Svelte + Internet Identity)          │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼─────────┐    ┌───────▼────────┐
│  User Management │    │  Engagement    │
│    Canister      │    │    Canister    │
│   (Motoko/Rust)  │    │ (Motoko/Rust)  │
└────────┬─────────┘    └───────┬────────┘
         │                       │
         │              ┌────────▼────────┐
         │              │  Payment/Escrow │
         │              │    Canister     │
         │              │  (Rust - ICRC)  │
         │              └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
            ┌────────▼─────────┐
            │  ckUSDC Ledger   │
            │   (ICRC-1/2)     │
            └──────────────────┘
```

## Detailed Canister Design

### 1. User Management Canister

**Purpose**: Store user profiles and reputation

**Data Structures**:
```motoko
type UserType = {
  #Lawyer;
  #Client;
  #Both;
};

type LawyerProfile = {
  principal: Principal;
  name: Text;
  jurisdiction: Text;
  specialization: [Text]; // ["Contract Law", "IP Law"]
  hourlyRate: ?Nat; // in ckUSDC cents
  verified: Bool;
  totalEngagements: Nat;
  rating: Float;
  walletAddress: Principal;
  createdAt: Int;
};

type ClientProfile = {
  principal: Principal;
  name: Text;
  totalEngagements: Nat;
  rating: Float;
  walletAddress: Principal;
  createdAt: Int;
};
```

**Key Functions**:
- `registerLawyer(profile: LawyerProfile)` - Create lawyer profile
- `registerClient(profile: ClientProfile)` - Create client profile
- `updateProfile(updates)` - Modify user info
- `getLawyerProfile(principal: Principal)` - Fetch lawyer data
- `searchLawyers(filters)` - Find lawyers by specialty/rate
- `updateReputation(principal: Principal, rating: Nat)` - Update after engagement

### 2. Engagement Canister

**Purpose**: Manage legal engagements, time tracking, and milestones

**Data Structures**:
```motoko
type EngagementType = {
  #Hourly: { rate: Nat }; // ckUSDC cents per hour
  #FixedFee: { amount: Nat }; // Total ckUSDC cents
  #Milestone: { milestones: [Milestone] };
  #Contingency: { percentage: Nat; expenses: Nat }; // % of settlement + expenses
};

type Milestone = {
  id: Nat;
  description: Text;
  amount: Nat; // ckUSDC cents
  status: MilestoneStatus;
  dueDate: ?Int;
  completedAt: ?Int;
};

type MilestoneStatus = {
  #Pending;
  #Completed;
  #Approved;
  #Disputed;
  #Cancelled;
};

type TimeEntry = {
  id: Nat;
  lawyerPrincipal: Principal;
  description: Text;
  hours: Float;
  rate: Nat; // ckUSDC cents per hour
  timestamp: Int;
  approved: Bool;
};

type Engagement = {
  id: Text; // UUID
  lawyer: Principal;
  client: Principal;
  engagementType: EngagementType;
  title: Text;
  description: Text;
  status: EngagementStatus;
  escrowAmount: Nat; // Total ckUSDC cents in escrow
  spentAmount: Nat; // Already paid out
  timeEntries: [TimeEntry];
  documents: [Document];
  messages: [Message];
  createdAt: Int;
  updatedAt: Int;
  completedAt: ?Int;
};

type EngagementStatus = {
  #Active;
  #Paused;
  #Completed;
  #Disputed;
  #Cancelled;
};

type Document = {
  id: Nat;
  name: Text;
  contentHash: Text; // SHA-256 hash
  uploadedBy: Principal;
  timestamp: Int;
  fileSize: Nat;
};

type Message = {
  id: Nat;
  sender: Principal;
  content: Text;
  timestamp: Int;
  encrypted: Bool;
};
```

**Key Functions**:
- `createEngagement(lawyer: Principal, client: Principal, terms: EngagementType, escrowAmount: Nat)` - Start new engagement
- `addTimeEntry(engagementId: Text, entry: TimeEntry)` - Log billable hours
- `approveTimeEntry(engagementId: Text, entryId: Nat)` - Client approves time
- `completeMilestone(engagementId: Text, milestoneId: Nat)` - Mark milestone done
- `approveMilestone(engagementId: Text, milestoneId: Nat)` - Client approves payment
- `addDocument(engagementId: Text, doc: Document)` - Upload file
- `sendMessage(engagementId: Text, msg: Message)` - Communication
- `getEngagement(id: Text)` - Retrieve engagement details
- `getUserEngagements(principal: Principal)` - List user's engagements
- `calculateCurrentFees(engagementId: Text)` - Real-time fee calculation

### 3. Payment/Escrow Canister

**Purpose**: Handle ckUSDC transactions, escrow, and payouts

**Data Structures**:
```motoko
type EscrowAccount = {
  engagementId: Text;
  client: Principal;
  lawyer: Principal;
  totalDeposited: Nat; // ckUSDC cents
  totalReleased: Nat;
  totalRefunded: Nat;
  balance: Nat; // Current escrow balance
  transactions: [Transaction];
};

type Transaction = {
  id: Nat;
  txType: TransactionType;
  amount: Nat;
  from: Principal;
  to: Principal;
  timestamp: Int;
  ckUSDCTransactionId: ?Nat; // Reference to actual ledger transaction
};

type TransactionType = {
  #Deposit;
  #Release;
  #Refund;
  #Dispute;
};
```

**Key Functions**:
- `depositToEscrow(engagementId: Text, amount: Nat)` - Client deposits ckUSDC
- `releasePayment(engagementId: Text, amount: Nat, reason: Text)` - Pay lawyer
- `requestRefund(engagementId: Text, amount: Nat)` - Client requests money back
- `getEscrowBalance(engagementId: Text)` - Check available funds
- `getTransactionHistory(engagementId: Text)` - View all transactions
- `autoRelease(engagementId: Text)` - Automatic payment on milestone approval

**ICRC-1/2 Integration**:
```rust
// Rust implementation for ckUSDC interaction
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{TransferArg, TransferError};
use icrc_ledger_types::icrc2::approve::{ApproveArgs, ApproveError};

// Transfer ckUSDC from client to escrow canister
async fn transfer_to_escrow(
    from: Account,
    amount: Nat,
    memo: Option<Vec<u8>>
) -> Result<Nat, TransferError> {
    let args = TransferArg {
        from_subaccount: from.subaccount,
        to: escrow_account(),
        fee: None,
        created_at_time: None,
        memo,
        amount,
    };
    
    ic_cdk::call::<(TransferArg,), (Result<Nat, TransferError>,)>(
        Principal::from_text("ckUSDC_CANISTER_ID").unwrap(),
        "icrc1_transfer",
        (args,),
    ).await
}

// Release payment from escrow to lawyer
async fn release_from_escrow(
    to_lawyer: Account,
    amount: Nat,
    engagement_id: String
) -> Result<Nat, TransferError> {
    let memo = format!("Release: {}", engagement_id).into_bytes();
    
    let args = TransferArg {
        from_subaccount: Some(engagement_subaccount(&engagement_id)),
        to: to_lawyer,
        fee: None,
        created_at_time: None,
        memo: Some(memo),
        amount,
    };
    
    // Escrow canister calls ckUSDC ledger
    ic_cdk::call::<(TransferArg,), (Result<Nat, TransferError>,)>(
        Principal::from_text("ckUSDC_CANISTER_ID").unwrap(),
        "icrc1_transfer",
        (args,),
    ).await
}
```

### 4. Frontend Canister

**Purpose**: Serve web application and handle user interactions

**Tech Stack**:
- React or Svelte
- Internet Identity integration
- Agent-js for canister calls
- TailwindCSS for styling

**Key Pages**:
1. **Landing/Login** - Connect with Internet Identity
2. **Dashboard** - Overview of all engagements
3. **Create Engagement** - Start new lawyer-client relationship
4. **Engagement Detail** - Track time, payments, documents
5. **Lawyer Profile** - View/edit lawyer information
6. **Payment Interface** - Deposit/withdraw ckUSDC

## User Flows

### Flow 1: Creating an Engagement (Hourly Rate)

```
1. Client logs in with Internet Identity
2. Client searches for lawyer or enters lawyer's Principal
3. Client fills engagement form:
   - Title: "Contract Review Services"
   - Type: Hourly
   - Rate: $150/hour (input as 15000 cents)
   - Initial escrow: $3,000 (300000 cents)
4. Client approves ckUSDC transfer to escrow canister
5. System creates engagement, notifies lawyer
6. Lawyer accepts engagement
7. Status: Active ✅
```

### Flow 2: Lawyer Logs Time

```
1. Lawyer opens engagement
2. Clicks "Add Time Entry"
3. Fills form:
   - Date: Today
   - Hours: 2.5
   - Description: "Reviewed merger agreement, identified 3 liability issues"
4. Submits - entry saved on-chain with timestamp
5. Client sees entry in real-time
6. Running total updated: 2.5 hrs × $150 = $375
7. Escrow balance: $3,000 - $375 (pending) = $2,625 available
```

### Flow 3: Client Approves and Payment Released

```
1. Client reviews time entry
2. Client clicks "Approve"
3. Engagement canister calls Payment canister
4. Payment canister executes ckUSDC transfer:
   - From: Escrow subaccount
   - To: Lawyer's wallet
   - Amount: 37500 cents ($375)
5. Transaction recorded on-chain
6. Entry status: Approved ✅
7. Lawyer receives notification
8. New escrow balance: $2,625
```

### Flow 4: Milestone-Based Engagement

```
1. Client creates engagement with milestones:
   - Milestone 1: "Initial consultation" - $500
   - Milestone 2: "Draft contract" - $1,500
   - Milestone 3: "Final revisions" - $1,000
2. Client deposits $3,000 to escrow
3. Lawyer completes Milestone 1, marks complete
4. Client reviews and approves
5. Smart contract auto-releases $500 to lawyer
6. Process repeats for remaining milestones
```

### Flow 5: Dispute Resolution (Future Enhancement)

```
1. Client disputes a time entry or milestone
2. Engagement status → Disputed
3. Both parties submit evidence
4. Options:
   a) Mutual agreement (recommended)
   b) Third-party arbitrator (selected from verified pool)
   c) DAO vote (token holders decide)
5. Resolution executed on-chain
6. Funds released accordingly
```

## Technical Implementation Details

### Internet Identity Integration

```typescript
// Frontend authentication
import { AuthClient } from "@dfinity/auth-client";

const authClient = await AuthClient.create();

// Login
async function login() {
  await authClient.login({
    identityProvider: "https://identity.ic0.app",
    onSuccess: async () => {
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      
      // Initialize canisters with authenticated identity
      initializeCanisters(identity);
      
      // Check if user has profile
      const profile = await userCanister.getProfile(principal);
      
      if (!profile) {
        // Redirect to profile creation
        router.push("/register");
      } else {
        // Redirect to dashboard
        router.push("/dashboard");
      }
    },
  });
}

// Logout
async function logout() {
  await authClient.logout();
  router.push("/");
}
```

### ckUSDC Balance Checking

```typescript
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "./ckusdc.did.js";

// Check user's ckUSDC balance
async function getBalance(principal: Principal) {
  const agent = new HttpAgent({ host: "https://ic0.app" });
  
  const ckusdcCanister = Actor.createActor(idlFactory, {
    agent,
    canisterId: "ckUSDC_CANISTER_ID",
  });
  
  const balance = await ckusdcCanister.icrc1_balance_of({
    owner: principal,
    subaccount: [],
  });
  
  return balance; // Returns in smallest unit (cents)
}
```

### Real-Time Fee Calculation

```motoko
// In Engagement Canister
public query func calculateCurrentFees(engagementId: Text) : async Result.Result<FeeBreakdown, Text> {
  switch (engagements.get(engagementId)) {
    case null { #err("Engagement not found") };
    case (?engagement) {
      let breakdown = switch (engagement.engagementType) {
        case (#Hourly(config)) {
          var totalHours : Float = 0;
          var approvedAmount : Nat = 0;
          var pendingAmount : Nat = 0;
          
          for (entry in engagement.timeEntries.vals()) {
            totalHours += entry.hours;
            let entryAmount = Float.toInt(entry.hours * Float.fromInt(entry.rate));
            
            if (entry.approved) {
              approvedAmount += Int.abs(entryAmount);
            } else {
              pendingAmount += Int.abs(entryAmount);
            };
          };
          
          {
            totalBilled = approvedAmount + pendingAmount;
            approved = approvedAmount;
            pending = pendingAmount;
            escrowBalance = engagement.escrowAmount - approvedAmount;
            hoursLogged = totalHours;
          }
        };
        
        case (#Milestone(config)) {
          var completed : Nat = 0;
          var approved : Nat = 0;
          var pending : Nat = 0;
          
          for (milestone in config.milestones.vals()) {
            switch (milestone.status) {
              case (#Completed) { pending += milestone.amount };
              case (#Approved or #Paid) { approved += milestone.amount };
              case (_) {};
            };
          };
          
          {
            totalBilled = approved + pending;
            approved = approved;
            pending = pending;
            escrowBalance = engagement.escrowAmount - approved;
            hoursLogged = 0; // N/A for milestones
          }
        };
        
        case (_) {
          // Handle other types
          {
            totalBilled = 0;
            approved = 0;
            pending = 0;
            escrowBalance = engagement.escrowAmount;
            hoursLogged = 0;
          }
        };
      };
      
      #ok(breakdown)
    };
  };
};
```

## Security Considerations

### 1. Access Control
- Only engagement participants can view/modify their engagements
- Time entries can only be added by the lawyer
- Approvals can only be done by the client
- Principal-based authorization on all functions

### 2. Escrow Safety
- Funds locked in canister-controlled subaccounts
- Multi-step release process (mark complete → approve → release)
- Automatic release only after explicit approval
- Dispute mechanism prevents unilateral withdrawal

### 3. Data Integrity
- All timestamps are IC system time (tamper-proof)
- Documents stored as hashes (verify integrity)
- Immutable transaction history
- Audit trail for all state changes

### 4. Privacy & Encryption (VetKeys)
- **VetKeys Integration**: End-to-end encryption for sensitive data
- All engagement documents encrypted with derived keys
- Messages encrypted using shared secrets between lawyer and client
- Only engagement participants can decrypt their data
- Attorney-client privilege enforced cryptographically
- Pseudonymous principals (Internet Identity)
- Keys derived from: `derivation_path = ["legal-engagement", engagement_id, "documents"]`

## Economic Model

### Platform Fees (Optional)
- 1% fee on all transactions (0.5% from lawyer, 0.5% from client)
- Collected in ckUSDC
- Can be disabled for initial launch

### Gas Costs
- ICP cycles paid by canisters
- Estimated costs:
  - Create engagement: ~0.001 ICP
  - Add time entry: ~0.0005 ICP
  - Release payment: ~0.002 ICP
- Consider cycles sponsorship for users

## Roadmap

### Phase 1: MVP (Hackathon)
- ✅ Internet Identity authentication
- ✅ Basic lawyer/client profiles
- ✅ Hourly rate engagements
- ✅ Time tracking
- ✅ ckUSDC escrow and payments
- ✅ Simple approval flow

### Phase 2: Enhanced Features
- Milestone-based engagements
- Fixed-fee engagements
- Document upload and storage
- Encrypted messaging
- Mobile-responsive design
- Email notifications (via external service)

### Phase 3: Advanced Features
- Dispute resolution mechanism
- Reputation system with reviews
- Multi-lawyer engagements (legal teams)
- Recurring retainer arrangements
- Invoice generation (PDF export)
- Integration with traditional payment methods

### Phase 4: Ecosystem
- Lawyer verification system
- Integration with other legal tools
- API for third-party integrations
- Cross-chain payments (Bitcoin, Ethereum)
- DAO governance for platform decisions

## Testing Strategy

### Unit Tests
- Test each canister function in isolation
- Mock Inter-Canister calls
- Verify access control logic

### Integration Tests
- Test full user flows end-to-end
- Verify ckUSDC transfers
- Test escrow lock/release mechanisms

### Security Audit
- Third-party audit before mainnet launch
- Penetration testing
- Economic attack vector analysis

## Deployment

### Local Development
```bash
# Start local replica
dfx start --clean --background

# Deploy Internet Identity locally
dfx deploy internet_identity

# Deploy canisters
dfx deploy user_management
dfx deploy engagement
dfx deploy payment_escrow
dfx deploy frontend

# Generate candid interface
dfx generate
```

### IC Mainnet
```bash
# Create canisters with cycles
dfx canister create --all --with-cycles 1000000000000

# Deploy to mainnet
dfx deploy --network ic

# Set ckUSDC canister ID in code
# Update frontend with production URLs
```

## VetKeys Integration for Encryption

### What is VetKeys?
VetKeys (Verifiable Encrypted Threshold Keys) is ICP's native encryption solution that allows canisters to derive encryption keys for users without ever exposing private keys. Perfect for attorney-client privilege protection.

### Key Features for Legal Use
- **Derived Encryption Keys**: Each engagement gets unique encryption keys
- **Threshold Decryption**: Keys are split across subnet nodes (no single point of failure)
- **Access Control**: Only authorized principals (lawyer + client) can decrypt
- **No Key Management**: Users don't handle private keys directly
- **Forward Secrecy**: Compromising one engagement doesn't affect others

### Implementation Architecture

```motoko
// VetKeys integration in Engagement Canister

type EncryptedData = {
  ciphertext: Blob;
  derivationPath: [Text];
  encryptedFor: [Principal]; // Who can decrypt
};

type EncryptedDocument = {
  id: Nat;
  name: Text;
  encryptedContent: EncryptedData;
  contentHash: Text; // Hash of plaintext
  uploadedBy: Principal;
  timestamp: Int;
  fileSize: Nat;
};

type EncryptedMessage = {
  id: Nat;
  sender: Principal;
  encryptedContent: EncryptedData;
  timestamp: Int;
};

// Derive encryption key for engagement
public func deriveEngagementKey(engagementId: Text) : async Result.Result<Blob, Text> {
  let derivation_path = ["legal-engagement", engagementId, "documents"];
  
  // Call VetKeys system API to derive key
  let key_result = await vetkKeys_derive_key({
    derivation_path = derivation_path;
    key_id = vet_key_id; // Master key ID from VetKeys
  });
  
  switch (key_result) {
    case (#ok(derived_key)) { #ok(derived_key) };
    case (#err(e)) { #err("Failed to derive key") };
  };
};

// Encrypt document before storing
public shared(msg) func uploadEncryptedDocument(
  engagementId: Text,
  fileName: Text,
  plaintext: Blob
) : async Result.Result<Nat, Text> {
  
  // Verify caller is part of engagement
  switch (engagements.get(engagementId)) {
    case null { return #err("Engagement not found") };
    case (?engagement) {
      if (msg.caller != engagement.lawyer and msg.caller != engagement.client) {
        return #err("Unauthorized");
      };
      
      // Derive encryption key
      let key_result = await deriveEngagementKey(engagementId);
      let encryption_key = switch (key_result) {
        case (#ok(key)) { key };
        case (#err(e)) { return #err(e) };
      };
      
      // Encrypt content
      let ciphertext = await vetKeys_encrypt({
        plaintext = plaintext;
        encryption_key = encryption_key;
      });
      
      // Calculate hash of plaintext for integrity
      let content_hash = SHA256.hash(plaintext);
      
      // Store encrypted document
      let doc_id = nextDocumentId;
      nextDocumentId += 1;
      
      let encrypted_doc : EncryptedDocument = {
        id = doc_id;
        name = fileName;
        encryptedContent = {
          ciphertext = ciphertext;
          derivationPath = ["legal-engagement", engagementId, "documents"];
          encryptedFor = [engagement.lawyer, engagement.client];
        };
        contentHash = content_hash;
        uploadedBy = msg.caller;
        timestamp = Time.now();
        fileSize = plaintext.size();
      };
      
      // Add to engagement
      let updated_docs = Array.append(engagement.documents, [encrypted_doc]);
      let updated_engagement = {
        engagement with documents = updated_docs
      };
      engagements.put(engagementId, updated_engagement);
      
      #ok(doc_id)
    };
  };
};

// Decrypt document for authorized user
public shared(msg) func downloadDocument(
  engagementId: Text,
  documentId: Nat
) : async Result.Result<Blob, Text> {
  
  switch (engagements.get(engagementId)) {
    case null { #err("Engagement not found") };
    case (?engagement) {
      // Verify caller is authorized
      if (msg.caller != engagement.lawyer and msg.caller != engagement.client) {
        return #err("Unauthorized - not part of engagement");
      };
      
      // Find document
      let doc_opt = Array.find<EncryptedDocument>(
        engagement.documents,
        func(d) { d.id == documentId }
      );
      
      switch (doc_opt) {
        case null { #err("Document not found") };
        case (?doc) {
          // Derive decryption key
          let key_result = await deriveEngagementKey(engagementId);
          let decryption_key = switch (key_result) {
            case (#ok(key)) { key };
            case (#err(e)) { return #err(e) };
          };
          
          // Decrypt content
          let plaintext = await vetKeys_decrypt({
            ciphertext = doc.encryptedContent.ciphertext;
            decryption_key = decryption_key;
          });
          
          // Verify integrity
          let calculated_hash = SHA256.hash(plaintext);
          if (calculated_hash != doc.contentHash) {
            return #err("Document integrity check failed");
          };
          
          #ok(plaintext)
        };
      };
    };
  };
};

// Encrypt message between lawyer and client
public shared(msg) func sendEncryptedMessage(
  engagementId: Text,
  messageContent: Text
) : async Result.Result<Nat, Text> {
  
  switch (engagements.get(engagementId)) {
    case null { #err("Engagement not found") };
    case (?engagement) {
      if (msg.caller != engagement.lawyer and msg.caller != engagement.client) {
        return #err("Unauthorized");
      };
      
      // Derive message encryption key
      let derivation_path = ["legal-engagement", engagementId, "messages"];
      let key_result = await vetkKeys_derive_key({
        derivation_path = derivation_path;
        key_id = vet_key_id;
      });
      
      let encryption_key = switch (key_result) {
        case (#ok(key)) { key };
        case (#err(e)) { return #err(e) };
      };
      
      // Encrypt message
      let plaintext_blob = Text.encodeUtf8(messageContent);
      let ciphertext = await vetKeys_encrypt({
        plaintext = plaintext_blob;
        encryption_key = encryption_key;
      });
      
      // Store encrypted message
      let msg_id = nextMessageId;
      nextMessageId += 1;
      
      let encrypted_msg : EncryptedMessage = {
        id = msg_id;
        sender = msg.caller;
        encryptedContent = {
          ciphertext = ciphertext;
          derivationPath = derivation_path;
          encryptedFor = [engagement.lawyer, engagement.client];
        };
        timestamp = Time.now();
      };
      
      let updated_messages = Array.append(engagement.messages, [encrypted_msg]);
      let updated_engagement = {
        engagement with messages = updated_messages
      };
      engagements.put(engagementId, updated_engagement);
      
      #ok(msg_id)
    };
  };
};
```

### VetKeys System API Integration

```rust
// In Rust canister for VetKeys integration

use ic_cdk::api::management_canister::main::{
    CanisterSettings, 
    CreateCanisterArgument,
};

// VetKeys derivation
#[ic_cdk::update]
async fn derive_encryption_key(
    derivation_path: Vec<Vec<u8>>,
) -> Result<Vec<u8>, String> {
    let request = VetKDeriveKeyRequest {
        derivation_path,
        key_id: VetKDKeyId {
            curve: VetKDCurve::Bls12_381,
            name: "legal_engagement_master_key".to_string(),
        },
    };
    
    let (response,): (VetKDeriveKeyResponse,) = ic_cdk::call(
        Principal::management_canister(),
        "vetkd_derive_key",
        (request,),
    )
    .await
    .map_err(|e| format!("VetKeys call failed: {:?}", e))?;
    
    Ok(response.encrypted_key)
}

// Encrypt data using derived key
pub async fn encrypt_data(
    plaintext: Vec<u8>,
    derivation_path: Vec<Vec<u8>>,
) -> Result<Vec<u8>, String> {
    let key = derive_encryption_key(derivation_path).await?;
    
    // Use AES-GCM with derived key
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("Cipher creation failed: {}", e))?;
    
    let nonce = Nonce::from_slice(&generate_nonce());
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_ref())
        .map_err(|e| format!("Encryption failed: {}", e))?;
    
    Ok(ciphertext)
}

// Decrypt data using derived key
pub async fn decrypt_data(
    ciphertext: Vec<u8>,
    derivation_path: Vec<Vec<u8>>,
) -> Result<Vec<u8>, String> {
    let key = derive_encryption_key(derivation_path).await?;
    
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("Cipher creation failed: {}", e))?;
    
    let nonce = Nonce::from_slice(&extract_nonce(&ciphertext));
    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|e| format!("Decryption failed: {}", e))?;
    
    Ok(plaintext)
}
```

### What Gets Encrypted?

**Always Encrypted (VetKeys):**
1. ✅ All uploaded documents (contracts, evidence, pleadings)
2. ✅ All messages between lawyer and client
3. ✅ Case notes and work product
4. ✅ Client personal information (if stored)
5. ✅ Sensitive financial details beyond amounts

**Not Encrypted (Needs to be queryable):**
1. ❌ Engagement ID and public metadata
2. ❌ Time entry descriptions (user choice - can be encrypted)
3. ❌ Payment amounts and timestamps
4. ❌ Public profile information
5. ❌ Engagement status

**User-Configurable:**
- Time entry descriptions can be encrypted for sensitive cases
- Client can mark entire engagement as "confidential" for extra encryption

### Security Benefits

1. **Attorney-Client Privilege**: Cryptographically enforced - only lawyer and client can access
2. **Compliance**: Meets legal requirements for data protection (GDPR, attorney ethics rules)
3. **No Trust Required**: Platform administrators cannot read engagement data
4. **Subpoena Resistant**: Even if canister is compromised, data remains encrypted
5. **Selective Disclosure**: Can grant temporary access to arbitrators if dispute arises

---

## Complete User Flow: Opening a New Case (Following Real Legal Practice)

This mirrors how lawyers and clients actually work together in traditional practice.

### Phase 1: Initial Contact & Consultation

#### Step 1: Client Finds Lawyer
**Real World**: Client searches online, gets referral, or visits law firm website
**Our App**:
```
1. Client logs in with Internet Identity
2. Clicks "Find a Lawyer"
3. Searches/filters by:
   - Practice area (Contract Law, IP, Employment, etc.)
   - Jurisdiction (New York, California, Kenya, etc.)
   - Hourly rate range ($100-$500/hour)
   - Language spoken
   - Rating/reviews
4. Views lawyer profiles with:
   - Bio and experience
   - Specializations
   - Rate structure
   - Availability
   - Past client ratings
```

#### Step 2: Initial Consultation Request
**Real World**: Client calls/emails to schedule consultation
**Our App**:
```
1. Client clicks "Request Consultation" on lawyer's profile
2. Fills out intake form:
   - Brief description of legal issue (encrypted with VetKeys)
   - Preferred contact method (encrypted messaging)
   - Urgency level (routine, urgent, emergency)
   - Budget expectations
3. Form is encrypted and sent to lawyer's dashboard
4. Lawyer receives notification
```

#### Step 3: Lawyer Reviews Request
**Real World**: Lawyer checks conflicts, reviews case basics
**Our App**:
```
1. Lawyer logs in, sees pending consultation request
2. Reviews encrypted client description
3. Checks for conflicts of interest (internal process)
4. Options:
   a) Accept - Schedule consultation
   b) Decline - With reason (outside expertise, conflict, etc.)
   c) Request more info
```

### Phase 2: Consultation & Engagement Agreement

#### Step 4: Consultation Meeting
**Real World**: In-person or video call meeting
**Our App**:
```
1. Lawyer accepts consultation
2. They exchange encrypted messages to schedule
3. During consultation (off-platform or via encrypted chat):
   - Lawyer explains their services
   - Client describes case in detail
   - They discuss scope of work
   - Lawyer provides estimated costs
4. After consultation, if moving forward...
```

#### Step 5: Creating the Engagement (The Core of Your App!)
**Real World**: Lawyer sends engagement letter/retainer agreement
**Our App**:

```
LAWYER CREATES ENGAGEMENT PROPOSAL:

1. Lawyer goes to "Create New Engagement"
2. Enters client's Principal ID or selects from consultation list
3. Fills engagement details form:

   📋 CASE INFORMATION:
   - Case Title: "Smith Employment Discrimination Case"
   - Practice Area: Employment Law
   - Case Description: (encrypted) "Wrongful termination claim..."
   - Expected Duration: 3-6 months
   - Complexity Level: Medium

   💰 FEE STRUCTURE (Choose one):
   
   Option A - HOURLY RATE:
   - Hourly Rate: $250/hour
   - Estimated Hours: 40-60 hours
   - Estimated Total: $10,000 - $15,000
   - Billing Increment: 0.25 hours (15 min)
   
   Option B - FLAT FEE:
   - Total Fee: $12,000
   - Payment Schedule: 
     * $4,000 upon signing
     * $4,000 at mid-point
     * $4,000 upon completion
   
   Option C - MILESTONE-BASED:
   - Milestone 1: "Initial investigation & demand letter" - $3,000
   - Milestone 2: "File EEOC complaint" - $4,000
   - Milestone 3: "Discovery and depositions" - $8,000
   - Milestone 4: "Trial preparation" - $5,000
   - Total: $20,000
   
   Option D - CONTINGENCY (future):
   - Percentage: 33% of settlement/judgment
   - Plus expenses: Estimated $2,000-$5,000

   💵 ESCROW REQUIREMENTS:
   - Initial Deposit Required: $5,000
   - Low Balance Alert: $1,000 (notify client to add funds)
   - Auto-stop work if balance below: $500

   📝 TERMS & CONDITIONS:
   - Refund policy: Unused retainer refunded within 30 days
   - Termination notice: 7 days
   - Communication expectations: Response within 48 hours
   - Dispute resolution: Mutual discussion → Arbitration
   - Attorney-client privilege applies
   - Data encrypted with VetKeys

4. Lawyer clicks "Send Engagement Proposal"
5. Proposal is encrypted and sent to client
```

#### Step 6: Client Reviews & Accepts
**Real World**: Client signs retainer agreement
**Our App**:
```
CLIENT REVIEWS PROPOSAL:

1. Client receives notification
2. Opens engagement proposal
3. Reviews all terms (decrypted with their key)
4. Sees clear breakdown:
   - What services are included
   - How much it will cost
   - Payment structure
   - How to track everything
   - What happens if they want to terminate

5. Client options:
   a) ACCEPT → Proceed to payment
   b) NEGOTIATE → Send counter-proposal
      - "Can we do $200/hour instead?"
      - "Can we do payment in 4 installments?"
   c) DECLINE → With optional reason

6. If client clicks ACCEPT:
   - Prompted to deposit initial escrow amount
   - Approves ckUSDC transfer ($5,000 in this case)
   - Confirms understanding of terms
   - Clicks "Confirm & Fund Engagement"
```

#### Step 7: Escrow Funding
**Real World**: Client writes check or wires retainer to lawyer's trust account
**Our App**:
```
SECURE PAYMENT PROCESS:

1. Client sees ckUSDC payment interface:
   "Deposit $5,000 to engagement escrow"
   
2. Client's ckUSDC balance shown: $10,000 available
   
3. Client clicks "Approve Transfer"
   
4. Behind the scenes:
   - Frontend calls Payment Canister
   - Payment Canister calls ckUSDC ledger
   - Transfer from client wallet → escrow subaccount
   - Transaction recorded on-chain with timestamp
   
5. Confirmation screen:
   ✅ "Escrow funded successfully!"
   - Transaction ID: #123456
   - Amount: $5,000.00
   - Escrow balance: $5,000.00
   - Status: Active
   
6. Lawyer receives notification:
   "Engagement funded - you can begin work"
```

### Phase 3: Active Case Management

#### Step 8: Lawyer Begins Work
**Real World**: Lawyer works on case, tracks time manually
**Our App**:
```
LAWYER LOGS WORK:

Day 1:
1. Lawyer opens engagement dashboard
2. Clicks "Add Time Entry"
3. Fills form:
   - Date: Nov 2, 2025
   - Hours: 2.5
   - Description: (encrypted) "Initial client intake meeting, reviewed employment contract, identified 3 potential claims under state law"
   - Rate: $250/hour (auto-filled)
   - Calculated amount: $625

4. Clicks "Submit"
5. Entry saved on-chain with tamper-proof timestamp

CLIENT SEES IMMEDIATELY:
- New time entry appears in real-time
- Running total updates: $625
- Escrow balance: $5,000 - $625 (pending) = $4,375 available
- Status: "Pending Your Approval"
```

#### Step 9: Client Reviews & Approves Work
**Real World**: Client gets invoice at end of month, pays 30-60 days later
**Our App**:
```
CLIENT APPROVAL PROCESS:

1. Client logs in, sees notification:
   "New time entry ready for review"

2. Client opens engagement, sees time entry:
   📅 Nov 2, 2025 | 2.5 hrs | $625
   📝 "Initial client intake meeting, reviewed employment 
       contract, identified 3 potential claims under state law"

3. Client options:
   ✅ APPROVE → Release payment immediately
   ❓ QUESTION → Send encrypted message asking for clarification
   ⚠️ DISPUTE → Flag for review (rare)

4. Client clicks "Approve"

5. Smart contract automatically:
   - Marks entry as approved
   - Calls Payment Canister
   - Releases $625 from escrow to lawyer's wallet
   - Records transaction on-chain
   - Updates balances

6. Confirmation:
   ✅ "Payment released to lawyer"
   - New escrow balance: $4,375
   - Lawyer has been paid: $625
   - Total spent: $625
```

#### Step 10: Ongoing Work & Communication
**Real World**: Phone calls, emails, meetings
**Our App**:
```
ENCRYPTED COMMUNICATION:

1. Client sends message (VetKeys encrypted):
   "Hi, just wanted to check on the status of my demand letter?"

2. Lawyer receives notification, responds:
   "Draft is ready for your review. I'm uploading it now."

3. Lawyer uploads document (VetKeys encrypted):
   - Clicks "Upload Document"
   - Selects file: "DemandLetter_Draft1.pdf"
   - File is encrypted before storage
   - Only lawyer and client can decrypt

4. Client downloads and reviews:
   - File automatically decrypted when downloaded
   - Client provides feedback via encrypted message

5. Lawyer continues logging time entries:
   - Nov 3: 3 hrs - "Drafted demand letter"
   - Nov 4: 1.5 hrs - "Revised based on client feedback"
   - Nov 5: 0.5 hrs - "Sent demand letter to opposing counsel"

6. Client approves each entry as work progresses
```

#### Step 11: Adding More Funds
**Real World**: Client receives bill, writes another check
**Our App**:
```
LOW BALANCE ALERT:

1. Escrow balance drops to $1,200 (below $1,000 alert threshold)
2. Both parties receive notification:
   "⚠️ Engagement escrow running low"

3. Client clicks "Add Funds"
4. Deposits another $3,000 to escrow
5. Work continues uninterrupted
6. New balance: $4,200
```

### Phase 4: Milestones & Progress (For Milestone-Based Engagements)

#### Alternative Flow: Milestone Completion
**Real World**: Lawyer completes phase of work, sends invoice
**Our App**:
```
MILESTONE-BASED TRACKING:

1. Engagement has defined milestones:
   ✅ Milestone 1: "Initial investigation" - $3,000 - COMPLETED
   🔄 Milestone 2: "File EEOC complaint" - $4,000 - IN PROGRESS
   ⏳ Milestone 3: "Discovery" - $8,000 - NOT STARTED

2. Lawyer completes Milestone 2:
   - Clicks "Mark Milestone Complete"
   - Uploads evidence (EEOC filing receipt - encrypted)
   - Adds note: "Complaint filed on Nov 15, 2025"

3. Client receives notification:
   "Milestone 2 completed - ready for your review"

4. Client reviews:
   - Views uploaded EEOC receipt
   - Confirms work was done
   - Clicks "Approve Milestone"

5. Smart contract auto-releases $4,000 to lawyer

6. Status updates:
   ✅ Milestone 2: PAID
   🔄 Milestone 3: Now active
```

### Phase 5: Case Resolution & Closing

#### Step 12: Case Concludes
**Real World**: Settlement reached or trial ends
**Our App**:
```
ENGAGEMENT COMPLETION:

1. Lawyer logs final time entries:
   - "Negotiated settlement agreement"
   - "Reviewed final settlement documents with client"
   - "Closed case file"

2. All time approved and paid

3. Lawyer clicks "Complete Engagement"

4. Final summary generated:
   📊 ENGAGEMENT SUMMARY:
   - Total hours worked: 47.5 hours
   - Total fees: $11,875
   - Total paid: $11,875
   - Escrow balance remaining: $125
   - Duration: 3 months, 12 days
   - Outcome: Settlement reached

5. Unused escrow refunded automatically:
   - $125 returned to client's wallet
   - Transaction recorded on-chain

6. Both parties can rate each other:
   - Client rates lawyer: ⭐⭐⭐⭐⭐
   - Lawyer rates client: ⭐⭐⭐⭐⭐
   
7. Engagement marked as COMPLETED
8. All data remains encrypted and accessible to both parties
9. Immutable record preserved forever on ICP
```

### Phase 6: Post-Engagement

#### Step 13: Record Keeping
**Real World**: Lawyer keeps file for 7+ years per ethics rules
**Our App**:
```
PERMANENT ACCESS:

1. Both parties can always access:
   - All time entries
   - All payments and transactions
   - All documents (encrypted)
   - All messages (encrypted)
   - Complete audit trail

2. Client can export:
   - Invoice summary (PDF)
   - Payment receipts
   - Case documents
   - For their records or taxes

3. Lawyer can reference:
   - For bar compliance
   - For similar future cases
   - For client relationship history
```

---

## Key Features That Mirror Real Legal Practice

### 1. **Retainer Management** ✅
- Just like real law: client puts money in trust account
- Lawyer bills against it
- Unused funds refunded

### 2. **Attorney-Client Privilege** ✅
- VetKeys encryption ensures confidentiality
- Only lawyer and client can access communications
- Meets ethical requirements

### 3. **Detailed Time Tracking** ✅
- Standard in legal industry
- Clients can see exactly what they're paying for
- Prevents billing disputes

### 4. **Transparent Billing** ✅
- No surprise invoices at end of month
- Real-time visibility
- Builds trust

### 5. **Multiple Fee Structures** ✅
- Hourly (most common)
- Flat fee (for predictable work)
- Milestone (for complex cases)
- Contingency (future feature)

### 6. **Scope Management** ✅
- Clear agreement upfront
- Client approves additional work
- Prevents scope creep

### 7. **Professional Records** ✅
- Immutable audit trail
- Meets bar association requirements
- Exportable for compliance

---

## Why This Flow Works

1. **Familiar to Lawyers**: Mirrors existing practice management software
2. **Builds Client Trust**: Transparency throughout
3. **Prevents Disputes**: Everything documented and agreed upon
4. **Efficient**: No waiting for end-of-month invoices
5. **Secure**: VetKeys encryption for privileged communications
6. **Compliant**: Meets legal ethics requirements
7. **Global**: Works across borders with ckUSDC

This is the flow you should build! Would you like me to help you create:
1. **UI mockups** for each step?
2. **Smart contract logic** for the engagement creation flow?
3. **Frontend code** for the key screens?
4. **VetKeys integration** code examples?
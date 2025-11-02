# Legal Fee Tracker: Transparent & Secure Legal Engagements on ICP

The Legal Fee Tracker is a groundbreaking decentralized application (dApp) built on the Internet Computer Protocol (ICP) designed to revolutionize how lawyers and clients manage their engagements. This platform offers unparalleled transparency, security, and trustlessness in legal fee tracking and financial agreements.

Leveraging the power of blockchain technology, the Legal Fee Tracker ensures:
*   **Transparent Billing:** Clients gain real-time visibility into legal work, time spent, and associated costs, eliminating billing surprises.
*   **Secure Escrow Payments:** Funds are held securely in smart contract-based escrow using ckUSDC (Chain-key USDC), ensuring payments are released only upon mutual agreement or milestone completion.
*   **Attorney-Client Privilege by Design:** Critical communications and documents are end-to-end encrypted using ICP's native VetKeys technology, guaranteeing confidentiality and compliance.
*   **Decentralized Trust:** Built on ICP, the platform operates without central intermediaries, fostering a trustless environment for all parties involved.

This project aims to streamline legal practice management, enhance client confidence, and set a new standard for secure and transparent legal services in the digital age.

## Features

*   **Engagement Management:** Create and manage legal engagements between lawyers and clients, supporting hourly, fixed-fee, and milestone-based structures.
*   **Escrow Services:** Securely hold client funds in an escrow contract using ckUSDC, with transparent payment releases upon approval.
*   **Time Tracking:** Allow lawyers to log billable hours with detailed descriptions, visible to clients in real-time.
*   **Milestone-based Payments:** Facilitate payments from escrow as predefined milestones are completed and approved by the client.
*   **User Reputation:** A review and rating system for lawyers and clients to build trust and accountability.
*   **Secure Communication & Document Management:** Encrypted messaging and document storage utilizing VetKeys for attorney-client privilege.

## Technologies Used

*   **Backend:** Motoko (for User Management and Engagement canisters) and Rust (for Payment/Escrow canister, integrating ICRC-1/2 standards).
*   **Frontend:** React, Vite, TailwindCSS for a modern and responsive user interface.
*   **Blockchain:** Internet Computer Protocol (ICP) for decentralized hosting and execution.
*   **Authentication:** Internet Identity for secure, privacy-preserving, and decentralized user authentication.
*   **Payments:** ckUSDC (Chain-key USDC) for stable, low-cost, and fast transactions.

## Technical Architecture

The Legal Fee Tracker is built upon a robust multi-canister architecture on the Internet Computer. It comprises a Frontend Canister for user interaction, a User Management Canister for profiles and reputation, an Engagement Canister for managing legal cases, and a Payment/Escrow Canister for secure financial transactions with the ckUSDC Ledger.

For a comprehensive overview of the system's design, including detailed canister structures, inter-canister communication, and user flows, please refer to the [Technical Architecture Document](technical_architecture.md).

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/)
*   [dfx](https://internetcomputer.org/docs/current/developer-docs/setup/install)

### Installation and Running

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local replica:
    ```bash
    dfx start --clean --background
    ```
4.  Deploy the canisters:
    ```bash
    dfx deploy
    ```
5.  Start the frontend development server:
    ```bash
    npm start
    ```

Your application will be available at `http://localhost:8080`.

## Testing

This project includes a suite of integration tests that can be run using `dfx`, covering complete user flows from registration to engagement completion.

For detailed instructions on running the various test scenarios, please refer to the "Testing Strategy" and "Complete User Flow" sections in the [Technical Architecture Document](technical_architecture.md).

## Security Considerations

Security is paramount for a legal platform. This project implements:
*   **Access Control:** Strict principal-based authorization ensures only engagement participants can view/modify their cases.
*   **Escrow Safety:** Funds are locked in canister-controlled subaccounts with multi-step release processes and dispute mechanisms.
*   **Data Integrity:** All on-chain data benefits from ICP's tamper-proof timestamps, immutable transaction history, and document content hashing.
*   **Privacy & Encryption (VetKeys):** End-to-end encryption for sensitive data like documents and messages, ensuring attorney-client privilege is cryptographically enforced.

For a deeper dive into the security architecture and VetKeys integration, see the [Technical Architecture Document](technical_architecture.md).

## Roadmap

The project is planned in phases, starting with an MVP and expanding to enhanced and advanced features.

### Phase 1: MVP (Hackathon)
*   ✅ Internet Identity authentication
*   ✅ Basic lawyer/client profiles
*   ✅ Hourly rate engagements
*   ✅ Time tracking
*   ✅ ckUSDC escrow and payments
*   ✅ Simple approval flow

### Phase 2: Enhanced Features
*   Milestone-based and Fixed-fee engagements
*   Document upload and encrypted storage
*   Encrypted messaging
*   Mobile-responsive design

### Phase 3: Advanced Features
*   Dispute resolution mechanism
*   Comprehensive reputation system
*   Multi-lawyer engagements
*   Invoice generation

### Phase 4: Ecosystem
*   Lawyer verification system
*   Integration with other legal tools
*   API for third-party integrations
*   DAO governance for platform decisions

For a complete breakdown of the roadmap, refer to the [Technical Architecture Document](technical_architecture.md).

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
# Frontend Build Guide: UI Flows and User Experience

## 1. Introduction

This document outlines the UI flows, pages, and user experience for the Legal Fee Tracker application. It is intended to guide the frontend developer in building a user-friendly interface that seamlessly interacts with the backend canisters. The application assumes users will authenticate using Internet Identity, and their principal will be used for all interactions with the backend.

## 2. Core Principles

- **Transparency**: Users should always have a clear understanding of their engagements, fees, and payment status.
- **Trust**: The UI should feel secure and reliable, especially around financial transactions.
- **Simplicity**: Despite the complexity of legal engagements, the UI should be intuitive and easy to navigate for both lawyers and clients.

## 3. Key Pages

The frontend application will consist of the following key pages:

1.  **Landing/Login Page**:
    -   **Purpose**: The entry point of the application.
    -   **Flow**:
        -   Presents a clean, professional landing page explaining the platform's value proposition.
        -   A single, prominent "Connect with Internet Identity" button.
        -   Upon successful authentication, the user is redirected to their dashboard. If it's a new user, they are guided to the profile creation page.

2.  **Dashboard**:
    -   **Purpose**: The user's home base, providing an overview of all their legal engagements.
    -   **Flow**:
        -   Displays a list of active, pending, and completed engagements.
        -   Each engagement summary should show key information like title, other party, status, and current fees/escrow balance.
        -   Provides entry points to create a new engagement or view the details of an existing one.
        -   Should have a clear call-to-action for the user's primary next step (e.g., "Review Time Entry", "Fund Escrow").

3.  **Profile Page (Lawyer/Client)**:
    -   **Purpose**: To create, view, and edit user profiles.
    -   **Flow**:
        -   **For Lawyers**: Fields for name, jurisdiction, specializations, hourly rate, and a professional bio.
        -   **For Clients**: Fields for name and contact information.
        -   This page is also where users can view their reputation/rating.

4.  **Find a Lawyer Page**:
    -   **Purpose**: Allows clients to search for and find suitable lawyers on the platform.
    -   **Flow**:
        -   Search bar with filters for specialization, jurisdiction, and hourly rate.
        -   Displays a list of lawyer profiles matching the search criteria.
        -   Clients can click on a profile to view more details and initiate a consultation or engagement.

5.  **Engagement Creation Page**:
    -   **Purpose**: A guided flow for creating a new legal engagement.
    -   **Flow**:
        -   A multi-step form to define the terms of the engagement.
        -   **Step 1: Parties**: Select the client and lawyer.
        -   **Step 2: Terms**: Define the engagement type (Hourly, Fixed Fee, Milestones), rates, and scope of work.
        -   **Step 3: Escrow**: Specify the initial escrow deposit amount.
        -   **Step 4: Review & Confirm**: Both parties review and agree to the terms.

6.  **Engagement Detail Page**:
    -   **Purpose**: The central hub for managing a single, active engagement.
    -   **Flow**: This page should be a dashboard for the engagement, with tabs or sections for:
        -   **Overview**: Key details, status, and financial summary (escrow balance, fees paid, etc.).
        -   **Time Tracking / Milestones**:
            -   For lawyers: A form to add new time entries.
            -   For clients: A view to review and approve pending time entries or milestones.
            -   A chronological log of all time entries/milestones.
        -   **Documents**: A secure place to upload, view, and manage engagement-related documents. All documents will be encrypted.
        -   **Payments**: A detailed transaction history for the engagement.
        -   **Communication**: An encrypted messaging interface for communication between the lawyer and client.

7.  **Payment/Escrow Interface**:
    -   **Purpose**: To handle all financial transactions.
    -   **Flow**:
        -   A simple interface for clients to deposit ckUSDC into the escrow for an engagement.
        -   Clear display of the user's ckUSDC balance.
        -   Confirmation modals for all transactions, showing the amount and recipient.

## 4. User Flows

### Flow 1: Onboarding a New User

1.  **User lands** on the homepage.
2.  **User clicks** "Connect with Internet Identity".
3.  **User is redirected** to the Internet Identity login page and authenticates.
4.  **Upon returning to the app**, the backend checks if a profile exists for the user's principal.
5.  **If no profile exists**:
    -   The user is prompted to create their profile (Lawyer or Client).
    -   The UI presents a simple form to gather necessary profile information.
    -   Once the profile is created, the user is redirected to their dashboard.
6.  **If a profile exists**: The user is taken directly to their dashboard.

### Flow 2: Client Creates an Engagement with a Lawyer

1.  **Client logs in** and navigates to the "Find a Lawyer" page.
2.  **Client searches** for a lawyer by specialization (e.g., "Contract Law").
3.  **Client reviews** the search results and clicks on a lawyer's profile.
4.  **On the lawyer's profile**, the client clicks "Request Engagement".
5.  **Client is taken** to the "Create Engagement" page and fills out the proposal form:
    -   **Title**: "Review of Service Agreement"
    -   **Type**: Hourly
    -   **Proposed Rate**: $200/hour (taken from lawyer's profile, but can be negotiated)
    -   **Initial Escrow Deposit**: $2,000
6.  **Client submits** the proposal. The lawyer is notified.
7.  **Lawyer reviews** the proposal on their dashboard and "Accepts".
8.  **Client is notified** of the acceptance and is prompted to fund the escrow.
9.  **Client clicks** "Fund Escrow", is taken to the payment interface, and approves the $2,000 ckUSDC transfer.
10. **Once the transfer is confirmed** on the backend, the engagement status changes to "Active".

### Flow 3: Lawyer Logs Time and Gets Paid (Hourly Engagement)

1.  **Lawyer navigates** to the "Engagement Detail" page for an active engagement.
2.  **Lawyer clicks** "Add Time Entry".
3.  **Lawyer fills in the details**:
    -   **Hours**: 3.5
    -   **Description**: "Drafted and revised the service agreement based on client feedback."
4.  **Lawyer submits** the time entry.
5.  **Client is notified** of the new time entry.
6.  **Client logs in**, navigates to the "Engagement Detail" page, and sees the pending time entry with a clear "Review" button.
7.  **Client reviews** the entry and clicks "Approve".
8.  **Upon approval**, the UI provides immediate feedback that the payment is being processed.
9.  **The backend automatically** releases the corresponding amount from the escrow to the lawyer's wallet.
10. **The UI updates** to reflect the new escrow balance and the updated amount paid to the lawyer. The time entry is marked as "Paid".

### Flow 4: Milestone-Based Engagement

1.  **During engagement creation**, the parties agree on three milestones:
    -   Milestone 1: "Initial Draft" - $1,000
    -   Milestone 2: "Revisions" - $1,500
    -   Milestone 3: "Final Delivery" - $500
2.  **Client deposits** the total of $3,000 into escrow.
3.  **Lawyer completes** the work for Milestone 1 and clicks "Mark as Complete" on the "Engagement Detail" page, optionally uploading the draft document.
4.  **Client is notified**, reviews the work, and clicks "Approve Milestone".
5.  **The UI confirms** that the milestone is approved, and the backend releases $1,000 to the lawyer.
6.  **The process repeats** for the remaining milestones.

## 5. Backend Interaction

-   **Authentication**: The frontend will use `@dfinity/auth-client` to manage Internet Identity authentication. The authenticated `identity` will be used to create an `actor` for making secure canister calls.
-   **Principal**: The user's principal, obtained from the `identity`, is the primary identifier for all backend operations (e.g., fetching profiles, creating engagements, authorizing actions).
-   **Canister Calls**: The frontend will call the public functions exposed by the backend canisters (`UserManagement`, `Engagement`, `PaymentEscrow`) to perform all actions.
-   **Data Structures**: The frontend should be built to handle the data structures defined in the `technical_architecture.md` document. For example, when displaying an engagement, the UI should be able to render all fields of the `Engagement` type.
-   **Real-time Updates**: For a dynamic user experience, the frontend should consider polling key data (like engagement status or new messages) or explore future options for real-time communication if the IC provides such features.

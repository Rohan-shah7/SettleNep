# SettleNep

**A Solana-powered remittance and settlement platform for Nepal.**

SettleNep aims to simplify cross-border payments for Nepalis living abroad by using Solana blockchain technology to make transfers more transparent, traceable, and efficient.

The project is being developed for the **Colosseum Crypto World’s Fair 2026 hackathon**.

## 1. Project Vision

Build a simple MVP that demonstrates how a user living abroad can initiate a digital transfer and how the intended recipient in Nepal can track and verify the settlement on Solana.

The initial version will use test funds and Solana Devnet. Real-money remittance, fiat conversion, and regulated payment processing are outside the MVP scope.

## 2. Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter or compatible wallet integration
- Solana Web3.js or the compatible Solana client libraries required by the Anchor version

### Blockchain Backend

- Solana programs written in Rust
- Anchor framework
- Anchor TypeScript client for program interaction
- Solana Devnet for development and testing

### Development Tools

- Node.js
- pnpm or npm
- Rust and Cargo
- Solana CLI
- Anchor CLI
- Git and GitHub

Use compatible versions of Solana, Anchor, Rust, and the TypeScript client libraries. Verify the installed toolchain before making configuration changes.

## 3. MVP Features

### A. Wallet Connection

- Connect a supported Solana wallet.
- Display the connected wallet address.
- Display the selected Solana network.
- Handle wallet disconnection and transaction errors.

### B. Create a Transfer

- Allow the sender to enter the recipient's Solana wallet address.
- Enter a transfer amount using Devnet test tokens.
- Enter an optional transfer reference or note.
- Validate the recipient address and amount.
- Show a transaction summary before confirmation.
- Submit the transaction for wallet approval.

### C. On-Chain Settlement

Create an Anchor program that supports the minimum safe transfer workflow.

- Initialize any required program state.
- Create a transfer record.
- Validate the sender, recipient, amount, and transfer status.
- Transfer the supported test asset using the appropriate Solana program.
- Record the transfer reference, sender, recipient, amount, and status on-chain.
- Emit events where useful.
- Prevent invalid state transitions and duplicate settlement.

Use SOL for the simplest initial demonstration, or use a suitable test SPL token if the MVP requires token-denominated transfers. Do not build both flows until the first flow works end to end.

### D. Transfer History

- Display transfers created by the connected wallet.
- Display sender and recipient addresses.
- Display the amount, transaction signature, timestamp when available, and settlement status.
- Provide a link to the Solana Explorer transaction page.
- Use on-chain program accounts, events, or transaction history as appropriate.

### E. Recipient Verification

- Allow a recipient to identify a transfer addressed to their wallet.
- Verify the transfer against the blockchain.
- Display the confirmed settlement status.
- Never display a transfer as successful merely because the frontend submitted a transaction.

### F. Basic User Interface

Create a clean, responsive interface with:

- Landing page
- Wallet connection
- Transfer form
- Transfer confirmation state
- Transfer history
- Transfer details page
- Loading, empty, success, and error states

Prioritize a working end-to-end demo over complex animations or unnecessary pages.

## 4. Proposed Architecture

```text
Next.js Frontend
       |
       | Wallet connection and user interactions
       v
Anchor TypeScript Client
       |
       | Solana transactions and account queries
       v
Solana Devnet
       |
       v
SettleNep Anchor Program
       |
       +--> Transfer state and validation
       +--> Supported asset transfer
       +--> On-chain transfer record
       +--> Events and status verification
```

The blockchain program is the source of truth for transfer state. The frontend must verify transactions and confirmed on-chain state rather than trusting local UI state.

Do not introduce a centralized backend unless a specific MVP requirement cannot reasonably be handled by the frontend and Solana program.

## 5. Smart Contract Requirements

The Anchor program must:

- Enforce account ownership and signer requirements.
- Validate all user-controlled inputs.
- Use appropriate account constraints.
- Handle token transfers through the correct Solana program and token accounts when SPL tokens are used.
- Prevent unauthorized settlement and invalid status changes.
- Prevent duplicate processing where the chosen transfer design requires it.
- Use appropriate account sizing and serialization.
- Include meaningful error codes.
- Include unit or program tests for success and failure cases.
- Avoid storing private information on-chain.

Do not store names, email addresses, phone numbers, identity documents, or other sensitive personal data on-chain.

Use a unique transfer identifier or reference to distinguish transfer records. Decide whether a transfer requires a dedicated PDA and document the account seeds and lifecycle.

## 6. Development Plan

Follow these phases in order. Complete and verify each phase before moving to the next.

### Phase 1: Inspect and Plan

- Inspect the existing repository and installed tools.
- Identify the existing frontend and Anchor program structure.
- Review the current dependencies and configuration.
- Write a short implementation plan.
- Identify missing requirements and technical risks.
- Do not overwrite existing working code without understanding it.

**Deliverable:** A documented architecture, MVP checklist, and implementation sequence.

### Phase 2: Project Setup

- Configure the Next.js frontend.
- Configure the Anchor program and local test environment.
- Configure Solana Devnet.
- Set up wallet connection.
- Add environment configuration and `.env.example`.
- Ensure secrets and wallet keypairs are excluded from Git.

**Deliverable:** Frontend runs, wallet connects, and the Anchor program builds.

### Phase 3: Smart Contract

- Define the transfer account structure and state transitions.
- Implement transfer creation and the chosen asset-transfer flow.
- Add account validation, authorization, and error handling.
- Write tests for valid and invalid transactions.
- Build and deploy to Devnet when local tests pass.

**Deliverable:** A tested Anchor program capable of processing the selected test transfer flow.

### Phase 4: Frontend Integration

- Connect the frontend to the deployed program.
- Build the transfer form and confirmation flow.
- Integrate wallet signing and transaction submission.
- Verify confirmed transaction results.
- Display transfer details and transaction signatures.

**Deliverable:** A user can initiate and verify a transfer through the frontend.

### Phase 5: Transfer History

- Query transfer records for the connected wallet.
- Display transfer status and transaction details.
- Add recipient-side verification.
- Handle loading, empty, pending, failed, and confirmed states.

**Deliverable:** A complete sender-to-recipient demo.

### Phase 6: Testing and Security

- Test invalid wallet addresses and amounts.
- Test unauthorized instructions.
- Test duplicate requests and invalid state transitions.
- Test wallet rejection and RPC failures.
- Test account ownership and asset-transfer correctness.
- Confirm that displayed statuses match on-chain results.
- Run frontend checks, Anchor tests, and production builds.

**Deliverable:** A reliable MVP with documented limitations.

### Phase 7: Hackathon Presentation

- Deploy the frontend to a suitable hosting platform.
- Deploy and verify the program on Devnet.
- Update the README with setup instructions and the program ID.
- Add screenshots and a demo video.
- Explain the problem, solution, architecture, and technical implementation.
- Document what is implemented and what remains future work.

**Deliverable:** A reproducible hackathon demo.

## 7. Agentic Development Rules

AI coding agents must follow these rules:

1. Inspect the repository before writing or changing code.
2. Preserve existing working code and project conventions.
3. Implement one small, testable feature at a time.
4. Do not generate the entire application in one step.
5. Before each phase, list the files to create or modify and explain the approach briefly.
6. After each implementation, run the relevant tests, builds, and static checks.
7. Fix errors before proceeding to the next phase.
8. Never invent a deployed program ID, transaction signature, test result, or environment variable value.
9. Never expose private keys, seed phrases, wallet files, or secrets.
10. Do not deploy to mainnet or perform real-money transactions.
11. Do not add unnecessary dependencies, frameworks, services, or features.
12. Keep documentation synchronized with actual implementation.
13. If a design decision affects security, asset custody, or account ownership, explain the alternatives before implementing it.
14. If a requirement is ambiguous, state the assumption and choose the simplest safe approach.
15. Maintain a checklist of completed work, pending work, and known issues.

## 8. Out of Scope for the MVP

Do not implement these features until the core transfer flow is complete:

- Real fiat deposits or withdrawals.
- NPR, USD, or other fiat currency conversion.
- Real-world bank integrations.
- Production remittance corridors.
- KYC/AML onboarding.
- Automated foreign-exchange pricing.
- Mainnet deployment.
- Complex admin dashboards.
- Multi-chain support.
- AI-based financial decision-making.

These may be explored as future features, subject to regulatory, security, and operational requirements.

## 9. Definition of Done

The MVP is considered complete when:

- [ ] The frontend runs successfully.
- [ ] A supported wallet connects to Solana Devnet.
- [ ] The Anchor program builds and passes its tests.
- [ ] A sender can initiate the supported test transfer.
- [ ] The transfer is validated and recorded on-chain.
- [ ] The intended recipient can verify the transfer.
- [ ] The frontend displays the actual transaction status.
- [ ] Transfer history shows the relevant transaction details.
- [ ] Invalid and unauthorized requests are rejected.
- [ ] Setup instructions allow another developer to reproduce the demo.
- [ ] The README accurately documents the deployed Devnet program and known limitations.

## 10. First Task for the Coding Agent

Start by inspecting the existing SettleNep repository.

Do not immediately generate the entire application.

First, report:

1. The current directory structure.
2. The existing Next.js and Anchor setup.
3. The installed versions of the relevant tools.
4. What already works and what is missing.
5. The recommended MVP architecture and transfer-account design.
6. The files that should be created or modified in Phase 1.
7. Any security or technical risks that should be resolved before implementation.

Then implement Phase 1 only. Wait for verification before beginning Phase 2.

The main objective is to deliver a working, testable Solana Devnet remittance prototype with a clear sender-to-recipient settlement flow, not an unfinished collection of features.

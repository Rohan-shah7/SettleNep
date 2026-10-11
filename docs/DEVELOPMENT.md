# SettleNep — Agentic Development Guide

This document defines the technical direction, MVP requirements, development phases, and working rules for AI coding agents contributing to SettleNep.

The goal is to build a working, testable prototype of programmable remittance settlement using Next.js and Solana programs written in Rust with Anchor.

## 1. Primary Objective

Build an end-to-end demonstration in which a user can:

1. Connect a Solana wallet.
2. Create a remittance using test assets.
3. Define an allocation plan.
4. Validate the transfer and allocation inputs.
5. Approve and sign the transaction.
6. Execute the supported on-chain operation.
7. Verify the resulting transaction and associated records.

The initial target is Solana Devnet. The application must not process real-money remittances.

Prioritize one complete, tested flow over many incomplete features.

## 2. Technical Constraints

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Solana wallet integration
- Compatible Solana JavaScript and Anchor TypeScript clients

### On-Chain Program

- Rust
- Anchor Framework
- Solana program accounts and instructions
- Program-derived addresses (PDAs) where appropriate
- Solana Devnet for integration testing

### Architecture Rules

- Do not introduce Laravel, PHP, MySQL, or a centralized backend.
- Do not add a database unless a new requirement explicitly justifies it.
- Use the blockchain as the source of truth for on-chain settlement state.
- Use the connected wallet to authorize transactions requiring user signatures.
- Use compatible dependency versions rather than blindly upgrading the toolchain.
- Keep the frontend and Anchor program independently testable.

## 3. Mandatory First Step: Inspect the Repository

Before changing code, inspect the existing repository.

Identify:

- Current directory structure.
- Existing Next.js application and package manager.
- Existing Anchor workspace and Rust program.
- `Anchor.toml`, `Cargo.toml`, and relevant package manifests.
- Installed versions of Node.js, Rust, Solana CLI, and Anchor CLI.
- Existing wallet integration and program instructions.
- Existing tests, configuration, and environment variables.
- Features that already work.
- Missing features, errors, and technical risks.

Do not assume the repository matches the example structure in `README.md`.

Do not replace existing files or generate duplicate projects without first understanding the current implementation.

### Phase 1 Deliverable

Provide a short report containing:

1. Existing architecture.
2. Working functionality.
3. Missing functionality.
4. Recommended transfer and allocation data model.
5. Files to create or modify.
6. Technical risks and proposed solutions.
7. Commands needed to verify the existing setup.

Implement only the inspection and planning deliverables first. Wait for approval before proceeding to Phase 2.

## 4. MVP Functional Requirements

### 4.1 Wallet Integration

- Connect a supported Solana wallet.
- Display the connected public address.
- Display the selected network.
- Handle wallet disconnection.
- Handle rejected signatures and transaction errors.
- Ensure the application targets Devnet during MVP development.

### 4.2 Remittance Creation

Provide a form with:

- Recipient wallet address.
- Transfer amount.
- Allocation categories.
- Allocation amounts.
- Optional non-sensitive reference.

Validate addresses, amounts, and allocation totals before submitting a transaction.

Do not collect sensitive personal information that is unnecessary for the prototype.

### 4.3 Allocation Rules

The initial allocation model should support an illustrative plan such as:

- Family expenses.
- Education.
- Savings.
- Emergency.

Requirements:

- Every allocation must have a valid, non-negative amount.
- The total allocation must satisfy the chosen allocation policy.
- Use integer base units or another precision-safe representation.
- Avoid floating-point arithmetic for on-chain monetary calculations.
- Clearly distinguish allocation metadata from actual fund distribution.
- Reject invalid allocation totals according to the selected policy.

For a fully allocated transfer, require the sum of the allocations to equal the transfer amount.

If the project supports partial allocation, document the policy and ensure the unallocated amount is handled explicitly.

Do not implement spending restrictions unless the contract has a clearly defined, tested mechanism to enforce them.

## 5. On-Chain Design

Before implementing the program, propose a minimal account and instruction design.

### Required Design Decisions

Document:

- Transfer account fields.
- Allocation representation.
- PDA seeds, if used.
- Account ownership and signer requirements.
- Supported asset and transfer mechanism.
- Transaction lifecycle.
- Duplicate-processing protections.
- Error handling.
- Account closure or retention policy, if applicable.

Use the simplest design that satisfies the MVP requirements safely.

### Security Requirements

- Validate all user-controlled inputs on-chain where security depends on them.
- Enforce account constraints and authorization.
- Prevent unauthorized access to transfer records or funds.
- Validate asset ownership and token accounts where applicable.
- Prevent invalid status transitions.
- Protect against duplicate or replayed processing where relevant.
- Use appropriate checked arithmetic and account sizing.
- Add meaningful custom errors.
- Test failure cases, not just successful transactions.

Never assume frontend validation alone is sufficient.

### Asset Selection

Start with one asset-transfer flow.

SOL may be the simplest initial option. An SPL token may be preferable if token-denominated settlement is essential to the demo.

Explain the trade-offs before implementation and select one approach. Do not implement both flows until the first works end to end.

## 6. Frontend Requirements

Build only the pages needed for the MVP.

Suggested screens:

- Landing page.
- Wallet connection.
- Remittance creation form.
- Allocation editor.
- Transaction review.
- Transfer history.
- Transfer details or verification.

The UI should include:

- Loading states.
- Validation errors.
- Wallet rejection handling.
- Pending transaction state.
- Confirmed transaction state.
- Failed transaction state.
- Empty history state.

Do not display a transaction as successful merely because the user clicked Submit or the wallet returned a transaction signature.

Verify the transaction and relevant on-chain state.

## 7. Transfer History and Verification

Determine the best retrieval strategy based on the actual account design.

Potential approaches include:

- Querying program-owned accounts.
- Reading transaction history and program events.
- Using an appropriate Solana RPC or indexing service if needed.

Prefer the simplest approach that works reliably for the MVP.

Do not introduce a centralized backend just to avoid implementing a basic on-chain query.

For each displayed transfer, show available information such as:

- Sender address.
- Recipient address.
- Amount and asset.
- Allocation details.
- Transaction signature.
- Confirmation status.
- Timestamp when available.

Provide a Solana Explorer link using the correct Devnet cluster.

Treat a transaction signature, account data, and transaction confirmation as distinct pieces of information. A signature alone does not prove successful settlement.

## 8. Development Phases

### Phase 1 — Inspect and Plan

- [x] Inspect existing files and dependencies.
- [x] Verify the development toolchain.
- [x] Identify completed and missing functionality.
- [x] Finalize the architecture.
- [x] Propose the account model and transfer flow.

### Phase 2 — Foundation

- [x] Configure the existing frontend.
- [x] Configure the existing Anchor workspace.
- [x] Establish a repeatable local testing workflow.
- [x] Configure Devnet.
- [x] Integrate wallet connection.
- [x] Add safe environment configuration.
- [x] Confirm the frontend and program build.

### Phase 3 — Smart Contract

- [x] Define transfer account structures.
- [x] Define allocation validation.
- [x] Implement required Anchor instructions.
- [x] Implement the selected asset-transfer mechanism.
- [x] Add authorization and account validation.
- [x] Add custom errors.
- [x] Test success and failure cases.
- [x] Build and verify the program.

### Phase 4 — Frontend Integration

- [x] Build the remittance form.
- [x] Build allocation inputs and validation.
- [x] Implement transaction review.
- [x] Connect the frontend to the Anchor program.
- [x] Submit wallet-authorized transactions.
- [x] Verify confirmed transaction results.

### Phase 5 — History and Verification

- [ ] Retrieve relevant transfer records.
- [ ] Display transfer and allocation details.
- [ ] Implement recipient-side verification.
- [ ] Add Solana Explorer links.
- [ ] Handle empty, pending, failed, and confirmed states.

### Phase 6 — Integration Testing

- [ ] Test invalid wallet addresses.
- [ ] Test zero and invalid amounts.
- [ ] Test invalid allocation totals.
- [ ] Test unauthorized instructions.
- [ ] Test duplicate-processing scenarios.
- [ ] Test wallet rejection.
- [ ] Test RPC failures.
- [ ] Test transaction confirmation.
- [ ] Run Anchor tests.
- [ ] Run frontend linting, type checks, and production build where configured.

### Phase 7 — Hackathon Demo

- [ ] Deploy the verified program to Devnet.
- [ ] Record the actual program ID.
- [ ] Verify the deployment and test flow.
- [ ] Configure the frontend for the deployed program.
- [ ] Capture screenshots.
- [ ] Record a demo video.
- [ ] Update the public README.
- [ ] Document remaining limitations.

## 9. Agentic Development Rules

Every coding agent must follow these rules:

1. Read this file and the root `README.md` before starting work.
2. Inspect the repository before making assumptions.
3. Do not generate the entire application in one step.
4. Work on one small, testable task at a time.
5. Before each phase, list the intended changes and relevant files.
6. Preserve working code and existing project conventions.
7. Run relevant tests, builds, and static checks after changes.
8. Report actual results, including failures.
9. Fix errors before moving to dependent tasks.
10. Never invent program IDs, deployment results, test results, or transaction signatures.
11. Never expose or commit private keys, seed phrases, wallet keypairs, or credentials.
12. Never deploy to mainnet or initiate real-money transactions.
13. Do not add unnecessary frameworks, backend services, or dependencies.
14. Do not store sensitive personal information on-chain.
15. Explain security-sensitive design decisions before implementing them.
16. Update the relevant checklist only when the work has actually been completed and verified.
17. Keep the README consistent with the actual implementation.
18. If an instruction is ambiguous, state the assumption and choose the simplest safe option.
19. Do not silently change the architecture or add major features beyond the approved MVP.

## 10. Environment and Secrets

- Keep local environment files out of Git.
- Provide `.env.example` only when environment variables are actually required.
- Include safe placeholder values, not real credentials.
- Never commit wallet keypairs or seed phrases.
- Never embed secret credentials in client-side Next.js variables.
- Treat all `NEXT_PUBLIC_` variables as publicly visible.
- Use Devnet for development and testing.

Do not invent environment variables before identifying which configuration the existing code requires.

## 11. Definition of Done

The MVP is complete when:

- [ ] The Next.js frontend runs successfully.
- [ ] A supported wallet connects to Devnet.
- [ ] The Anchor program builds and passes its tests.
- [ ] A user can create a supported test transfer.
- [ ] Allocation rules are validated correctly.
- [ ] The program enforces required authorization and validation.
- [ ] Transfer records are verifiable on-chain.
- [ ] The frontend shows actual confirmed transaction status.
- [ ] Relevant transfer history is available.
- [ ] Invalid and unauthorized operations are rejected.
- [ ] Another developer can reproduce the setup using the documentation.
- [ ] The demo works using test assets only.

## 12. First Coding-Agent Prompt

Begin by reading `README.md` and `docs/DEVELOPMENT.md`.

Inspect the current SettleNep repository and report its structure, installed tool versions, existing functionality, missing features, and technical risks.

Propose the minimal architecture and account design for the programmable remittance MVP.

Implement Phase 1 only. Do not start generating the full application, overwrite working files, deploy to mainnet, or introduce a centralized backend.

After completing Phase 1, report your findings, the proposed next steps, and the verification results. Wait for approval before proceeding to Phase 2.

---

**Guiding principle:** Build a small, secure, testable Solana settlement prototype before expanding into a full remittance platform.
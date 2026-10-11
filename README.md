# SettleNep 🇳🇵

> Programmable remittance settlement infrastructure built on Solana.

SettleNep is a hackathon prototype exploring how blockchain infrastructure can improve cross-border remittance settlement and reconciliation, with Nepal as the initial use case.

Instead of treating a remittance as a single transfer, SettleNep explores **programmable remittances**, where a sender defines how the transferred value should be allocated among different purposes.

## Example

A sender initiates a hypothetical $500 remittance to Nepal:

- $300 → Family expenses
- $100 → Education
- $50 → Savings
- $50 → Emergency

SettleNep aims to let users define allocation rules, validate them, and record transfer and allocation information on Solana.

**Note:** Recording an allocation does not automatically restrict how a recipient spends funds. Enforcing spending restrictions requires additional smart-contract logic and a supported payment mechanism.

## ⚠️ Prototype Notice

SettleNep is a hackathon prototype intended for **Solana Devnet and test assets**.

It does not process real-money remittances, perform fiat currency conversion, or provide a production remittance service.

A future production deployment would require appropriate regulatory approvals, licensed financial and remittance partners, KYC/AML processes, and compliant fiat settlement infrastructure.

## Problem Statement

Cross-border remittances can involve multiple intermediaries, limited visibility into settlement status, and fragmented reconciliation processes.

SettleNep explores how programmable blockchain transactions could provide:

- Transparent and verifiable settlement records.
- Configurable allocation rules.
- On-chain transaction references.
- Easier settlement verification.
- A foundation for future integration with compliant remittance providers.

## Core Features

The MVP will prioritize:

- **Wallet connection:** Connect a supported Solana wallet.
- **Remittance creation:** Enter a recipient wallet address and test transfer amount.
- **Programmable allocation:** Define and validate allocations across categories.
- **On-chain settlement:** Submit a supported test transfer through an Anchor program.
- **Transfer verification:** Verify confirmed transactions and settlement records.
- **Transaction history:** View relevant sender, recipient, amount, allocation, and transaction details.

Features will be marked complete only after implementation and testing.

## Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Solana wallet integration
- Compatible Solana JavaScript and Anchor TypeScript clients

### Blockchain Backend

- Solana
- Rust
- Anchor Framework
- Anchor TypeScript client
- Solana Devnet

### Development Tools

- Node.js
- pnpm or npm
- Rust and Cargo
- Solana CLI
- Anchor CLI
- Git and GitHub

Use compatible dependency versions and inspect the existing project before changing its configuration.

## Architecture

```text
              SettleNep
                  |
                  v
          Next.js Frontend
          TypeScript / Tailwind
                  |
                  v
          Solana Wallet
                  |
                  v
          Anchor TypeScript Client
                  |
                  v
             Solana Devnet
                  |
                  v
          SettleNep Program
            Rust / Anchor
                  |
          +-------+--------+
          |                |
          v                v
     Transfer State   Allocation Rules
          |
          v
   On-Chain Records
          |
          v
   Verified Transaction
```

The Solana program is the source of truth for on-chain transfer state.

The frontend communicates with Solana through the appropriate client libraries and wallet integration. Transactions requiring authorization must be signed by the user's wallet.

No centralized backend or database is required for the initial MVP.

## Core Flow

```text
Connect Wallet
      |
      v
Create Remittance
      |
      v
Define Allocation Rules
      |
      v
Validate Amounts and Allocations
      |
      v
Review Transaction
      |
      v
User Signs Transaction
      |
      v
Anchor Program Validates
      |
      v
Execute Supported Test Transfer
      |
      v
Record Allocation and Transfer
      |
      v
Confirm Transaction on Solana
      |
      v
Display Verified Status
```

The exact account structure and transaction design must be finalized before implementation. Do not assume that recording allocation rules automatically distributes funds to multiple recipients.

## Smart Contract Requirements

The Anchor program should:

- Validate sender, recipient, amount, and allocation inputs.
- Enforce signer requirements and account ownership.
- Ensure allocations are valid and do not exceed the intended transfer amount.
- Use program-derived addresses (PDAs) where appropriate.
- Record relevant transfer and allocation data on-chain.
- Prevent unauthorized operations and invalid state transitions.
- Prevent duplicate processing where applicable.
- Return meaningful error codes.
- Include tests for valid and invalid instructions.
- Avoid storing sensitive personal information on-chain.

Start with one supported asset-transfer flow on Devnet. Use SOL for the simplest initial demonstration, or choose a test SPL token if required. Do not implement both until the first flow works end to end.

## Project Structure

The actual directory structure may differ. Inspect the existing repository and preserve working code.

A possible structure is:

```text
SettleNep/
├── frontend/              # Next.js application, if organized separately
├── programs/              # Anchor Rust programs, if using an Anchor workspace
├── tests/                 # Anchor program tests
├── docs/                  # Architecture and documentation
├── Anchor.toml            # Anchor configuration
├── Cargo.toml             # Rust workspace configuration
├── .gitignore
├── .env.example
├── README.md
└── LICENSE
```

Keep the existing repository structure if your frontend and Anchor program are already organized differently. Do not create duplicate applications or move files unnecessarily.

## Development Roadmap

### Phase 1 — Inspect and Plan

- [ ] Inspect the existing repository and directory structure.
- [ ] Verify the Next.js and Anchor setup.
- [ ] Check installed tool versions.
- [ ] Identify missing features and technical risks.
- [ ] Finalize the MVP architecture and transfer-account design.

### Phase 2 — Foundation

- [ ] Configure the frontend and development environment.
- [ ] Configure the Anchor program and testing environment.
- [ ] Connect a supported wallet to Devnet.
- [ ] Add safe environment configuration.
- [ ] Verify that the frontend and program build successfully.

### Phase 3 — Programmable Remittance

- [ ] Design the transfer account and allocation data model.
- [ ] Implement allocation validation.
- [ ] Implement the selected test asset-transfer flow.
- [ ] Record transfer and allocation information on-chain.
- [ ] Add authorization and error handling.
- [ ] Test valid and invalid transactions.

### Phase 4 — Frontend Integration

- [ ] Build the remittance form.
- [ ] Add allocation inputs and validation.
- [ ] Add transaction review and wallet signing.
- [ ] Connect the frontend to the Anchor program.
- [ ] Display confirmed transaction results.

### Phase 5 — Verification and History

- [ ] Display relevant transfer records.
- [ ] Verify recipient and transaction details.
- [ ] Display allocation information.
- [ ] Handle pending, failed, and confirmed states.
- [ ] Link to Solana Explorer transactions.

### Phase 6 — Testing and Demo

- [ ] Run Anchor program tests.
- [ ] Run frontend checks and production build.
- [ ] Test wallet rejection and RPC failures.
- [ ] Verify account constraints and transfer correctness.
- [ ] Deploy the tested program to Devnet.
- [ ] Add screenshots and a demo video.
- [ ] Document setup instructions and limitations.

## Agentic Development Guidelines

AI coding agents working on SettleNep must follow these rules:

1. Inspect the repository before changing files.
2. Follow existing project conventions.
3. Implement one small, testable feature at a time.
4. Explain planned changes before each phase.
5. Run relevant tests and builds after implementation.
6. Fix failures before proceeding.
7. Never invent program IDs, transaction signatures, or test results.
8. Never expose private keys, seed phrases, or credentials.
9. Do not deploy to mainnet or use real funds.
10. Avoid unnecessary dependencies, frameworks, and services.
11. Keep documentation synchronized with the implementation.
12. Explain security-sensitive design decisions before implementing them.
13. Maintain a checklist of completed features, pending tasks, and known issues.

**First task:** Inspect the current repository, report what exists, identify what is missing, and finalize the MVP implementation plan. Implement only the inspection and planning phase before generating additional features.

## Out of Scope for the MVP

- Real fiat deposits and withdrawals.
- Live NPR/USD conversion.
- Production bank integrations.
- Real-money remittance processing.
- KYC/AML onboarding.
- Mainnet deployment.
- Multi-chain support.
- Automated foreign-exchange pricing.
- Centralized backend and database.
- Complex administrative dashboards.

These features may be considered in future versions, subject to technical feasibility, compliance, and business requirements.

## Definition of Done

- [ ] The frontend runs successfully.
- [ ] A supported wallet connects to Solana Devnet.
- [ ] The Anchor program builds and passes its tests.
- [ ] A user can initiate the supported test transfer.
- [ ] Allocation rules are validated.
- [ ] The program records relevant on-chain information.
- [ ] Confirmed transaction status is displayed correctly.
- [ ] Transfer history and allocation details are available.
- [ ] Invalid and unauthorized operations are rejected.
- [ ] Another developer can reproduce the demo using this README.
- [ ] The deployed program ID, demo links, and screenshots are added when available.

## License

This project is intended to use the MIT License. Add a `LICENSE` file containing the MIT license text before representing the repository as officially MIT-licensed.

---

**Built for the Colosseum Crypto World’s Fair 2026 hackathon.**

SettleNep is an experimental project exploring programmable remittances and transparent settlement infrastructure for Nepal.
# SettleNep 🇳🇵

> Programmable remittance settlement infrastructure built on Solana.

SettleNep is a blockchain-powered remittance prototype exploring how programmable transactions can improve settlement transparency and reconciliation, with Nepal as the initial use case.

Instead of treating remittances as simple transfers, SettleNep explores how senders can define allocation rules for different purposes, such as family expenses, education, savings, and emergencies.

Built with **Next.js, Rust, Anchor, and Solana**, SettleNep is being developed for the Colosseum Crypto World’s Fair 2026 hackathon.

## 💡 The Idea

Imagine someone living abroad wants to send $500 worth of supported digital assets to their family in Nepal.

They define the following allocation plan:

| Purpose | Allocation |
|---|---:|
| Family expenses | $300 |
| Education | $100 |
| Savings | $50 |
| Emergency | $50 |
| **Total** | **$500** |

SettleNep aims to make these allocation rules verifiable and associate them with on-chain settlement records.

*Illustrative example only. Allocation records do not automatically restrict spending or distribute funds unless the implemented smart-contract logic explicitly supports those behaviors.*

## 🎯 The Problem

Cross-border remittance processes can involve multiple intermediaries, fragmented reconciliation, and limited visibility into settlement status.

SettleNep explores how Solana can provide:

- Verifiable on-chain settlement records.
- Programmable allocation rules.
- Transparent transaction history.
- Recipient-side transaction verification.
- A foundation for future integration with compliant remittance providers.

## ✨ Planned MVP Features

- **Wallet connection:** Connect a supported Solana wallet.
- **Remittance creation:** Enter a recipient address and transfer amount.
- **Allocation planning:** Define and validate purpose-based allocations.
- **On-chain settlement:** Execute a supported test-asset transfer through an Anchor program.
- **Transaction verification:** Verify confirmed transactions and on-chain records.
- **Transfer history:** View relevant transaction and allocation details.

Features will be marked complete as they are implemented and tested.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Wallet integration | Compatible Solana wallet adapter |
| Blockchain | Solana |
| Smart contracts | Rust, Anchor Framework |
| Client integration | Compatible Solana and Anchor TypeScript libraries |
| Development network | Solana Devnet |

SettleNep does not require a centralized Laravel backend or MySQL database for its initial MVP.

## 🏗️ Architecture

```text
          Next.js Frontend
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
        SettleNep Anchor Program
             Rust / Anchor
                  |
          +-------+-------+
          |               |
          v               v
    Transfer State   Allocation Rules
          |
          v
     On-Chain Records
          |
          v
    Transaction Verification
```

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm or pnpm
- Rust and Cargo
- Solana CLI
- Anchor CLI
- A supported Solana wallet

Install tool versions compatible with the existing project configuration.

### Clone the Repository

```bash
git clone https://github.com/Rohan-shah7/SettleNep.git
cd SettleNep
```

### Run the Frontend

Follow the actual frontend directory and package manager used in the repository.

If the frontend is located in `frontend/` and uses npm:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Build the Anchor Program

Run these commands from the Anchor workspace root, where `Anchor.toml` is located:

```bash
anchor build
anchor test
```

The required validator and test configuration must be set up before running the tests.

For detailed development instructions, see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## ⚠️ Prototype Notice

SettleNep is an experimental hackathon project intended for Solana Devnet and test assets.

It does not currently provide real-money remittance processing, fiat conversion, or production financial services.

Any future production deployment would require appropriate regulatory approvals, compliant settlement infrastructure, and suitable financial or remittance partners.

## 📍 Project Status

**Status: Under Development**

The implementation status will be updated as features are completed and verified.

- [ ] Wallet integration
- [ ] Remittance and allocation interface
- [ ] Anchor program implementation
- [ ] On-chain transfer records
- [ ] End-to-end settlement flow
- [ ] Transaction history and verification
- [ ] Devnet testing
- [ ] Demo video and screenshots

## 🗺️ Roadmap

1. Inspect and finalize the project architecture.
2. Establish the frontend and Anchor development environments.
3. Implement the transfer and allocation model.
4. Integrate the frontend with the Solana program.
5. Test the complete settlement flow on Devnet.
6. Prepare the hackathon demonstration and documentation.

## 🔐 Security

- Never commit private keys, seed phrases, or wallet keypairs.
- Never store sensitive personal information on-chain.
- Validate instructions and account ownership in the Anchor program.
- Verify confirmed transactions before displaying success.
- Do not use mainnet or real funds during MVP development.

## 📄 License

The project license will be specified once a `LICENSE` file has been added to the repository.

---

Built for the **Colosseum Crypto World’s Fair 2026 hackathon**.

**SettleNep — Exploring programmable remittances on Solana.**
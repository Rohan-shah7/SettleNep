# SettleNep 🇳🇵

> Programmable remittance settlement infrastructure built on Solana.

SettleNep is a prototype exploring how blockchain infrastructure can improve cross-border remittance settlement and reconciliation, with Nepal as the initial use case.

Instead of treating a remittance as a single transfer, SettleNep explores **programmable remittances** where a sender can define how the transferred value should be allocated.

### Example

A sender sends **$500** to Nepal:

* $300 → Family expenses
* $100 → Education
* $50 → Savings
* $50 → Emergency

The allocation rules can be validated and recorded through a Solana-based settlement layer.

## ⚠️ Prototype Notice

SettleNep is a hackathon prototype using **Solana Devnet/test assets**.

It does not process real-money remittances or provide a real cryptocurrency-to-fiat remittance service.

Any future production deployment would require appropriate regulatory approvals, licensed financial/remittance partners, KYC/AML processes, and compliant fiat settlement infrastructure.

## Architecture

```text
                    SettleNep
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
         Next.js                Laravel
         Frontend                Backend
             │                     │
             │                     ▼
             │                   MySQL
             │                     │
             ▼                     │
       Solana Wallet               │
             │                     │
             ▼                     │
       Solana Devnet              │
             │                     │
             ▼                     │
       Anchor Program ◄────────────┘
        Rust / Anchor
```

## Technology Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS

### Backend

* Laravel
* TypeScript
* Prisma
* MySQL

### Blockchain

* Solana
* Solana Devnet
* Rust
* Anchor Framework

## Core Flow

```text
Create Remittance
        ↓
Define Allocation
        ↓
Validate Allocation
        ↓
Create Solana Transaction
        ↓
User Wallet Signs
        ↓
Anchor Program
        ↓
Settlement Confirmation
        ↓
Laravel Records Transaction
        ↓
Dashboard Shows Status
```

## Project Structure

```text
SettleNep/
├── frontend/          # Next.js application
├── backend/           # Laravel API
├── solana-program/    # Rust + Anchor Solana program
├── docs/              # Architecture and project documentation
├── .gitignore
└── README.md
```

## Current Status

🚧 **Under Development**

Initial project setup:

* [x] Next.js frontend
* [x] Laravel backend
* [x] MySQL/Prisma setup
* [x] Solana/Anchor project setup
* [ ] Database schema
* [ ] Remittance API
* [ ] Allocation system
* [ ] Anchor program
* [ ] Wallet integration
* [ ] Settlement flow
* [ ] Devnet testing
* [ ] Demo UI
* [ ] Documentation

## Development

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/SettleNep.git
cd SettleNep
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Solana Program

```bash
cd solana-program
anchor build
```

## Environment Variables

Environment files containing secrets are intentionally excluded from Git.

Create local environment files based on the provided examples when they are added.

**Never commit private keys, wallet seed phrases, database passwords, API secrets, or other credentials.**

## License

MIT License
# SettleNep
# SettleNep
# SettleNep
# SettleNep

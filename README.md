# SettleNep 🇳🇵

> Programmable remittance settlement infrastructure built on Solana.

SettleNep is a blockchain-powered remittance prototype exploring how programmable transactions can improve settlement transparency and reconciliation, with Nepal as the initial use case.

Instead of treating remittances as simple transfers, SettleNep explores how senders can define allocation rules for different purposes, such as family expenses, education, savings, and emergencies.

Built with **Next.js, Rust, Anchor, and `@solana/kit`**, SettleNep is being developed for the Colosseum Crypto World’s Fair 2026 hackathon.

[![CI](https://github.com/Rohan-shah7/SettleNep/actions/workflows/ci.yml/badge.svg)](https://github.com/Rohan-shah7/SettleNep/actions/workflows/ci.yml)

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

*Illustrative example only. Allocation records describe the intended split; they do not automatically restrict or distribute funds.*

## 🎯 The Problem

Cross-border remittance processes can involve multiple intermediaries, fragmented reconciliation, and limited visibility into settlement status.

SettleNep uses Solana to provide:

- Verifiable on-chain settlement records (a `Settlement` PDA per transfer).
- Programmable, on-chain-validated allocation rules (amounts must sum to the transfer).
- Transparent transaction history for the connected sender.
- Recipient-side verification, no wallet required.
- A foundation for future integration with compliant remittance providers.

## ✅ Implemented

- **Anchor program** (`settlenep`, ID `GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ`): creates a `Settlement` PDA carrying sender, recipient, amount, up to 8 purpose allocations, an optional 32-byte reference, timestamp, nonce, and status. Validates recipients, amounts, allocation totals, and rejects duplicate sender+nonce retries.
- **Frontend** (`Next.js` App Router + `@solana/kit` 8, `@solana/react`, React 19, Tailwind v4):
  - `/send` — recipient/amount/reference + allocation builder (live sum check), review step, wallet-backed send, confirmation, on-chain read-back.
  - `/history` — the connected sender's settlements, fetched with `getProgramAccounts` (no backend DB), each with confirmation status and Explorer link.
  - `/verify` — recipient/payer lookup by settlement address **or** sender + nonce (PDA re-derived), works without a wallet.
  - Landing page with feature cards and navigation.
- **Codama client** — TypeScript SDK generated from the Anchor IDL.
- **Tests**: 11 Anchor/LiteSVM Rust tests; 52 Vitest unit tests (`npm test`); three E2E scripts exercising the full flow against a live validator via the real RPC client.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4 |
| Client SDK | `@solana/kit` 8, `@solana/kit-plugin-rpc`, `@solana/kit-plugin-wallet`, `@solana/react` |
| Blockchain | Solana |
| Smart contracts | Rust, Anchor 1.x |
| Client generation | Codama (`@codama/cli`, renderers-js) |
| Testing | Anchor/LiteSVM (Rust), Vitest (frontend), esbuild E2E scripts |
| Development/deploy network | Local validator (`solana-test-validator`); Devnet (see [`docs/DEVNET-DEPLOY.md`](docs/DEVNET-DEPLOY.md)) |

SettleNep does not require a centralized backend or database — the chain is the source of truth.

## 🏗️ Architecture

```text
          Next.js Frontend
                  |
                  v
            Solana Wallet
                  |
                  v
        @solana/kit 8 Client
        (Codama-generated)
                  |
                  v
           Solana RPC
       (localnet | devnet)
                  |
                  v
         SettleNep Anchor Program
              Rust / Anchor
                  |
          +-------+-------+
          |               |
          v               v
    Settlement State  Allocation Rules
          |
          v
     On-Chain Records
          |
          v
 Transaction Verification
```

## 🚀 Local Demo

Run the full flow on your machine — no Devnet SOL or faucet required (the local node has an unlimited faucet and the program is baked into genesis).

### Prerequisites

- Node.js ≥ 20, npm
- Rust + Cargo, Solana CLI, Anchor CLI (versions compatible with the project pins)

### 1. Start the validator with the program at genesis

```bash
cd solana-program
solana-test-validator --reset \
  --bpf-program GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ target/deploy/settlenep.so
```

(Build the program first with `NO_DNA=1 anchor build` if `.so` is missing.)

### 2. Fund the demo sender (optional, only for the CLI scripts)

```bash
solana airdrop 10 --url http://127.0.0.1:8899
```

### 3. Run the frontend against localnet

```bash
cd frontend
npm install
cp .env.example .env  # then set NEXT_PUBLIC_SOLANA_CLUSTER=localnet
npm run dev
```

Open `http://localhost:3000`. The History page works without a wallet; Sending and sender History need a connected wallet. Note: Phantom/Solflare do not sign transactions on localnet (their networks are devnet/testnet) — the live wallet flow is demonstrated on Devnet (see Deployment below).

### 4. E2E proof (automated, no browser needed)

```bash
cd frontend
npm run typecheck && npm test
npx esbuild scripts/e2e-create.ts --bundle --platform=node --format=cjs --alias:@=. --outfile=/tmp/e2e-create.cjs && node /tmp/e2e-create.cjs
npx esbuild scripts/e2e-history.ts --bundle --platform=node --format=cjs --alias:@=. --outfile=/tmp/e2e-history.cjs && node /tmp/e2e-history.cjs
npx esbuild scripts/e2e-errors.ts  --bundle --platform=node --format=cjs --alias:@=. --outfile=/tmp/e2e-errors.cjs  && node /tmp/e2e-errors.cjs
```

Each script prints a `RESULT: PASS` after exercising send → confirm → history → verify against the running validator.

## 🚀 Deployment (Devnet)

The program is deployed locally under a canonical ID (`GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ`). The full step-by-step runbook (funding, deploy, integrity verification, Devnet E2E, `.env` swap, Vercel hosting) lives in **[`docs/DEVNET-DEPLOY.md`](docs/DEVNET-DEPLOY.md)**. Remaining work is entirely operator-side: fund the deploy wallet, provide a `getProgramAccounts`-enabled Devnet RPC URL, and run the runbook.

## ⚠️ Limitations (MVP)

- **SOL-only**: transfers move SOL tokens between Solana addresses.
- **Allocation metadata only**: allocations document the intended split; they are not independently funded or restricted.
- **Single status**: settlements are created as `Settled`; there is no cancel/refund/claim transition yet.
- **History RPC dependency**: `/history` uses `getProgramAccounts`, which several public RPCs (including `api.devnet.solana.com`) disable — a gPA-enabled Devnet RPC is required for that page on Devnet.
- **Wallet demo**: Phantom/Solflare do not sign against localnet; live wallet sending is demonstrated on Devnet.
- For detailed development constraints, see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

## 📍 Project Status

| Item | State |
|---|---|
| Anchor program (create settlement + validation) | ✅ Implemented & tested (11 Rust tests) |
| Remittance + allocation interface | ✅ Implemented |
| On-chain settlement records | ✅ Implemented |
| End-to-end settlement flow | ✅ Implemented & E2E-verified on localnet |
| Transaction history + verification | ✅ Implemented & E2E-verified on localnet |
| Frontend quality gates | ✅ lint / typecheck / 52 unit tests / build |
| Devnet deployment | 📘 Steps ready — see [`docs/DEVNET-DEPLOY.md`](docs/DEVNET-DEPLOY.md) |
| Demo video and screenshots | ⏳ Pending capture |

## 🔐 Security

- Never commit private keys, seed phrases, or wallet keypairs — the deploy keypair at `solana-program/target/deploy/settlenep-keypair.json` is gitignored; back it up securely.
- Never store sensitive personal information on-chain.
- The program validates recipients, amounts, and allocation totals and rejects duplicate sender+nonce attempts.
- The frontend verifies confirmed transaction status before showing success.
- Do not use mainnet or real funds during MVP development.

## 📄 License

The project license will be specified once a `LICENSE` file has been added to the repository.

---

Built for the **Colosseum Crypto World’s Fair 2026 hackathon**.

**SettleNep — Exploring programmable remittances on Solana.**
# Devnet Deployment Runbook

Steps to deploy SettleNep to **Solana Devnet** and host the frontend publicly.
The program ID is canonical across every environment:

```
GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ
```

> The deploy keypair is `solana-program/target/deploy/settlenep-keypair.json`
> (gitignored). A verified backup lives outside the repo. Keep it secure — it is
> also the upgrade authority for the deployed program.

## Status (real, verifiable)

- **Program: DEPLOYED and verified on Devnet.** `solana program show` → slot
  510174157, data length 166,864 bytes, rent 0.8485 SOL, upgrade authority
  `EkNJ…`. Deployed bytes SHA-256 `7db5f8f7…6157a1` = local build (byte-for-byte).
- **Live Devnet transaction:** `42L7GwePFWL9xAAp6PCexQQM1NfvZSkE6z4P9bAaPxtv8AD2YjbMMJAJoGT1wBfaaVfxZJuNC9rJFQ174gy8NYHT`
  ([Explorer](https://explorer.solana.com/tx/42L7GwePFWL9xAAp6PCexQQM1NfvZSkE6z4P9bAaPxtv8AD2YjbMMJAJoGT1wBfaaVfxZJuNC9rJFQ174gy8NYHT?cluster=devnet))
  → `e2e-create` printed `RESULT: PASS`.
- **Frontend `.env`:** set to Devnet with a **gPA-enabled Helius RPC** (verified:
  `e2e-create` and `e2e-history` both `RESULT: PASS` over it).
- **Live web app:** https://settle-nep.vercel.app/ deployed on Vercel (all routes
  serve 200, header hydration verified). `/history` unlocks on the live site
  once `NEXT_PUBLIC_SOLANA_RPC_URL` in Vercel is set to the Helius URL.
- **Remaining:** (1) swap Vercel env var to the Helius URL + redeploy, (2)
  Phantom → Devnet browser wallet demo, (3) screenshots + demo video.

---

## 0. Prerequisites

| Requirement | Why | How |
|---|---|---|
| Devnet SOL in the deploy wallet (`~/.config/solana/id.json`) | Pays rent + fees (program: 166 KB, rent-exempt min ≈ **0.85 SOL**; peak with temp buffer ≈ **1.7 SOL**) | Phantom → Devnet → "Get SOL", or the browser faucet at faucet.solana.com. CLI `solana airdrop` is rate-limited. |
| A **Devnet RPC with `getProgramAccounts`** enabled (Helius / QuickNode) | The public `api.devnet.solana.com` disables `getProgramAccounts`, which `/history` requires | Create a free Helius/QuickNode Devnet endpoint; optionally restrict the key by IP. |
| The Solana & Anchor CLIs | Deploy tooling | `solana --version`, `anchor --version` (project pin: anchor-cli 1.1.2) |

Check the wallet balance before starting:

```bash
solana balance --url https://api.devnet.solana.com
# deploy wallet: EkNJjfTm1dZMSYGbuiSUZDwoDE6B5uGxfHM34e3QmcdW
```

---

## 1. Build the program (reproducible)

```bash
cd solana-program
NO_DNA=1 anchor build
sha256sum target/deploy/settlenep.so   # record this hash
solana-keygen pubkey target/deploy/settlenep-keypair.json  # must print GFq…
```

The hash recorded here is the reference for the on-chain integrity check in step 3.

---

## 2. Deploy to Devnet

```bash
cd solana-program
anchor deploy --provider.cluster devnet
```

- The payer is the default CLI wallet (`~/.config/solana/id.json`, i.e. `EkNJ…`).
- Up to ~1.7 SOL is needed for the temporary deploy buffer + rent-exempt data.
- This bind is update-safe: the program ID does **not** change between deploys (the keypair at `target/deploy/settlenep-keypair.json` is deterministic).

---

## 3. Verify the deployment

```bash
# Metadata: authority, data length, slot
solana program show GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ \
  --url <YOUR_DEVNET_RPC_URL>

# Byte-for-byte integrity: dump the deployed program and compare hashes
solana program dump GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ /tmp/live.so \
  --url <YOUR_DEVNET_RPC_URL>
sha256sum /tmp/live.so
```

The dumped hash must match the local hash from step 1. (The dump may be padded; if they differ only by trailing zero bytes, trim them and compare again:

```bash
truncate -s $(stat -c%s solana-program/target/deploy/settlenep.so) /tmp/live.so && sha256sum /tmp/live.so
```

Expect `Owner: BPFLoaderUpgradeab1e…` and `Executable: true`.)

---

## 4. End-to-end checks on Devnet

Run the E2E suites against the live Devnet network using the dedicated RPC.
They need only the RPC — they sign with the CLI wallet (`RPC_URL` env override).

```bash
cd frontend
export RPC_URL=<YOUR_DEVNET_RPC_URL>

npx esbuild scripts/e2e-create.ts  --bundle --platform=node --format=cjs --alias:@=. --outfile=/tmp/e2e-create.cjs  && node /tmp/e2e-create.cjs
npx esbuild scripts/e2e-history.ts --bundle --platform=node --format=cjs --alias:@=. --outfile=/tmp/e2e-history.cjs && node /tmp/e2e-history.cjs
```

Each prints a `RESULT: PASS`. The settlement signatures printed by `e2e-create`
open directly in the Solana Explorer:

```
https://explorer.solana.com/tx/<SIG>?cluster=devnet
```

---

## 5. Point the frontend at Devnet

Create/overwrite `frontend/.env` (gitignored):

```dotenv
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=<YOUR_DEVNET_RPC_URL>
NEXT_PUBLIC_SETTLENEP_PROGRAM_ID=GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ
```

Rebuild and run the quality gates (these vars are baked in at build time —
changes require a rebuild):

```bash
cd frontend
npm run typecheck && npm run lint && npm test && npm run build
```

Smoke-test locally first:

```bash
npm run start   # then open http://localhost:3000
```

- `/verify` works without a wallet (paste a settlement address or sender+nonce).
- `/history` should list the sender's settlements from step 4 (proves the RPC's `getProgramAccounts` works).
- **Important:** make sure Phantom is switched to **Devnet** (network selector) before Sending from the browser.

---

## 6. Live wallet demo (browser)

1. Phantom → network: **Devnet**.
2. Open the app (localhost or the Vercel URL), click **Connect Wallet**.
3. Go to `/send`, fill recipient / amount / allocations, review, **Sign & Send**.
4. Approve the transaction in Phantom; wait for confirmation.
5. See the settlement in `/history` and on the Explorer.
6. `/verify` the settlement address from any device (no wallet needed) for the recipient demo.

---

## 7. Public hosting (Vercel)

1. Push the repo (including the CI workflow) to GitHub (`main`).
2. Vercel → **Add New Project** → import `Rohan-shah7/SettleNep`.
3. Framework preset: **Next.js**; Root Directory: `frontend`.
4. Build settings: leave defaults (next build).
5. Environment variables (same three values as `frontend/.env`):
   - `NEXT_PUBLIC_SOLANA_CLUSTER=devnet`
   - `NEXT_PUBLIC_SOLANA_RPC_URL=<YOUR_DEVNET_RPC_URL>`
   - `NEXT_PUBLIC_SETTLENEP_PROGRAM_ID=GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ`
6. Deploy. Every push to `main` now also runs CI (`.github/workflows/ci.yml`).

> `NEXT_PUBLIC_*` values are public by design (embedded in the browser bundle).
> Never put keys or secrets in these variables — keep private keys server-side
> or out of the project entirely. A dedicated RPC isolated to a single IP avoids
> burner abuse; set that in the RPC provider dashboard, not in the code.

---

## 8. Upgrade authority & security notes

- **Upgrade authority** = the deploy wallet (`EkNJ…`). Any future `anchor deploy`
  (after modifying the program) must be signed by it. Back it up.
- Never commit `target/deploy/settlenep-keypair.json` or any `id.json`.
- The program rejects duplicate sender+nonce retries (`DuplicateSettlement`) and
  validates allocations (sum == amount, ≤ 8 purposes) — see `docs/plan.md`.
- This is a **test-network MVP**: no mainnet, no real funds.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `airdrop request failed. This can happen when the rate limit is reached.` | CLI faucet rate-limited; use the browser faucet / Phantom "Get SOL". |
| `getProgramAccounts` returns 403 / disabled | The endpoint killed gPA; use a gPA-enabled RPC key (Helius/QuickNode). |
| `Transaction simulation failed … insufficient funds` | Wallet empty or Phantom still on another network; fund Devnet / switch to Devnet. |
| Phantom shows "Method not supported" on send | Wallet is on a non-Devnet network; set network to Devnet. |
| Dump hash ≠ local hash | Padding — run the `truncate` compare in step 3 before worrying. |
| Vercel build fails on `next build` | Confirm Root Directory is `frontend` and Node ≥ 20. |

---

*Program ID: `GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ` · Deploy wallet: `EkNJjfTm1dZMSYGbuiSUZDwoDE6B5uGxfHM34e3QmcdW`*
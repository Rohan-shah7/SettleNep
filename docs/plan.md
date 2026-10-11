# SettleNep — Master Project Plan

Rolling, phase-by-phase execution plan for the SettleNep programmable-remittance MVP (Solana Devnet, Anchor/Rust program + Next.js frontend).

Every phase ends with verified results and an explicit approval checkpoint. Work one phase at a time. Update the phase checkboxes in `docs/DEVELOPMENT.md` only after the work is actually done and verified.

## Current State

- **Phase 1 (Inspect and Plan)** — complete, approved.
- **Phase 2 (Foundation)** — complete, verified (wallet connection, env config, Anchor/Devnet config, local testing workflow).
- **Phase 3 (Smart Contract)** — next. Planned in detail below.
- Deployed program: none yet (Devnet deploy is Phase 7). Program ID keypair exists but is not deployed.

## Toolchain (pinned, verified)

| Tool | Version |
| --- | --- |
| Node.js | 24.10.0 |
| npm | 11.6.1 |
| Rust (system) | 1.98.1 |
| Rust (solana-program, rust-toolchain pinned) | 1.89.0 |
| Solana CLI (Agave) | 3.1.10 |
| Anchor CLI | 1.1.2 |
| anchor-lang | 1.1.2 (pinned `"=1.1.2"`) |
| LiteSVM (dev) | 0.10.0 |

Do not bump these versions without re-verifying the full build + test + frontend pipeline.

## Frontend Stack (locked)

- Next.js 16.3.6 (App Router, Turbopack), React 19.3.0, TypeScript 5, Tailwind v4.
- Client: `@solana/kit` 8.4.0, `@solana/kit-plugin-rpc` 0.19.0, `@solana/kit-plugin-wallet` 0.21.0, `@solana/react` 8.4.0, `swr` 2.5.1.
- No wallet-adapter — Wallet Standard via the Kit plugin stack (decision from Phase 2).
- tsconfig target `ES2020` (BigInt requirement).

## On-Chain Design (locked in Phase 1, approved)

**Asset:** SOL only for the MVP.

**Account `Settlement`:**
- PDA seeds: `[b"settlement", sender, nonce.to_le_bytes()]`.
- Fields: `sender: Pubkey`, `recipient: Pubkey`, `amount: u64` (lamports), `reference: [u8; 32]`, `allocations: [Allocation; MAX_ALLOCATIONS]`, `allocation_count: u8`, `created_at: i64`, `status: u8` (0 = Initialized, 1 = Settled, 2 = Cancelled), `nonce: u64`, `bump: u8`.

**Allocation:**
- `Allocation { purpose: u8, amount: u64 }`.
- Purposes: Family = 0, Education = 1, Savings = 2, Emergency = 3, Other = 4.
- `MAX_ALLOCATIONS = 8`.
- Policy: **fully allocated** — `sum(allocation amounts) == transfer amount`, rejected otherwise.

**Instruction `create_settlement`:**
- Single atomic instruction: writes the Settlement record and transfers the exact SOL amount via a `system_program` CPI (sender → recipient) in the same transaction.
- Sets status to `Settled` on success.

**Error codes (custom):**
- `InvalidRecipient`, `InvalidAmount`, `NoAllocations`, `TooManyAllocations`, `AllocationMismatch`, `DuplicateSettlement`, `Unauthorized`, `MathOverflow`.

**Duplicate protection:** nonce is sender-chosen; PDA collision (`DuplicateSettlement`) prevents reusing the same `(sender, nonce)` pair.

## Environment

- `.env.example` (frontend): `NEXT_PUBLIC_SOLANA_CLUSTER`, `NEXT_PUBLIC_SOLANA_RPC_URL`, `NEXT_PUBLIC_SETTLENEP_PROGRAM_ID`.
- Anchor.toml provider stays on `localnet` so `anchor test` runs the LiteSVM cargo-test suite locally. Devnet deploy happens explicitly in Phase 7 via `anchor deploy --provider.cluster devnet`.
- Deploy keypair: `~/.config/solana/id.json` (must be funded on Devnet in Phase 7).

## Orchestration Rules

1. Never generate the whole app at once; one small, testable task per step.
2. Before each phase, list intended changes and relevant files.
3. Never invent program IDs, signatures, deployment results, or test results.
4. Never expose or commit keypairs, seeds, or credentials. `NEXT_PUBLIC_` vars are public.
5. Run the relevant checks after every change: `cargo test`/`anchor test`, `npm run lint`, `npm run typecheck`, `npm run build`.
6. Create or modify files, never rebuild the repo from scratch.
7. Wait for approval at each phase boundary.

---

## Phase 3 — Smart Contract (implement the settlement program)

Replace the stock Anchor counter with the settlement program. All values use integer base units (`lamports`), never floats.

### Tasks
- [ ] Replace `Counter` state with `Settlement` + `Allocation` in `src/state.rs`; keep `InitSpace`.
- [ ] Rewrite `src/constants.rs`: `SETTLEMENT_SEED = b"settlement"`, `MAX_ALLOCATIONS = 8`, purpose constants, `INITIALIZED = 0 / SETTLED = 1 / CANCELLED = 2`.
- [ ] Replace error enum in `src/error.rs` with the custom list above.
- [ ] Remove counter instructions; add `src/instructions/create_settlement.rs`:
  - Validate recipient (nonzero, not system program), amount > 0, allocations count in `1..=MAX_ALLOCATIONS`.
  - Validate each allocation amount is nonzero and sum `== amount` (checked arithmetic).
  - Derive PDA `[b"settlement", sender, nonce.to_le_bytes()]`; return `DuplicateSettlement` if it already exists.
  - Init the account, record metadata, then CPI-transfer the full amount sender → recipient via `system_program`, set status `Settled`.
- [ ] Update `src/lib.rs`: `declare_id` unchanged, expose `create_settlement`.
- [ ] Rewrite `tests/test_initialize.rs` (LiteSVM) as a settlement test suite covering success and failures: happy path + on-chain state, allocations, recipient balance, duplicate nonce, zero/invalid amount, empty allocations, too many allocations (9), allocation sum mismatch, invalid recipient, math overflow.
- [ ] Keep the local provider so `anchor test` runs `cargo test` via LiteSVM; do not attempt Devnet in this phase.
- [ ] `NO_DNA=1 anchor build` and `NO_DNA=1 anchor test` must pass.
- [ ] Optionally rename the crate `solana-program` → `settlenep` (touches Cargo.toml, lib.rs, Anchor.toml `[programs.*]`, tests, IDL paths). Decide explicitly; if skipped, document why.

### Verify
```
cd solana-program && NO_DNA=1 anchor build
cd solana-program && NO_DNA=1 anchor test
```

### Approval checkpoint
Show results (IDL summary, passing/failing tests) and wait for approval before Phase 4.

---

## Phase 4 — Frontend Integration (create a remittance)

Build the remittance creation flow against the deployed-by-test program ID locally.

### Tasks
- [x] Generate/place the program client (`target/types/*.ts` from the built IDL) in the frontend and wire it into the existing Kit `AppClient` in `frontend/app/providers.tsx`.
- [x] Build the remittance form page: recipient address, amount, allocation category editor (up to 8 allocations, purpose + amount), optional reference (`[u8; 32]` encode + decode).
- [x] Client-side validation mirroring on-chain rules before submit (recipient valid, amount > 0, allocation count in range, sum == amount, no duplicates).
- [x] Transaction review step showing the exact settlement being created (sender, recipient, amount, allocations) before wallet signature.
- [x] Pick the nonce deterministically and safely; derive the PDA on the client and show the expected settlement account.
- [x] Submit via Wallet Standard (`@solana/kit-plugin-wallet`), versioned transaction v1.
- [x] Handle loading, wallet rejection, and error states; never claim success from a signature alone.
- [x] Verify on-chain state after confirmation (read back the Settlement account via Kit).

### Verify
- [x] `npm run typecheck`, `npm run lint`, `npm run build`.
- [x] End-to-end create flow against a local validator with a funded keypair (deployed `settlenep.so` + generated Kit client): create instruction → confirm → read back `Settlement` → recipient balance. PASS (`frontend/scripts/e2e-create.ts`).

> **Decision (transaction version):** `solana-test-validator` (agave 3.1.10) fails to deserialize the `@solana/kit` transaction **v1** wire format (`failed to fill whole buffer` during simulation); the identical flow passes with `version: 0`. Devnet runs the same 3.x software, so the frontend now plans **version 0** transactions (`providers.tsx`), and the wallet gates check `supportedTransactionVersions.has(0)`. Revisit v1 once network support lands.

### Approval checkpoint
Show a successful create flow result and wait for approval.

---

## Phase 5 — History and Verification

### Tasks
- [x] Implement transfer history retrieval for the connected sender (query `getProgramAccounts` by sender field / filter on the PDA seed prefix; no backend DB).
- [x] Display transfer list + detail view: sender, recipient, amount, allocations, reference, status, signature, confirmation status, timestamp.
- [x] Recipient-side verification page: recipient pastes a settlement address or nonce and sees the compensating on-chain record.
- [x] Solana Explorer link using the Devnet cluster and the real signature.
- [x] Empty, pending, failed, and confirmed UI states throughout.

### Verify
- [x] `npm run typecheck`, `npm run lint`, `npm run build`.
- [x] End-to-end: create → confirm → appears in history → verified by address against a live local validator (`frontend/scripts/e2e-history.ts`); dev-server smoke test `/`, `/send`, `/history`, `/verify` all 200.

### Approval checkpoint
Wait for approval.

---

## Phase 6 — Integration Testing

### Tasks
- [ ] Program: failure tests already in Phase 3; add any gaps (unauthorized, invalid status transitions if state grows).
- [ ] Frontend: invalid address, zero/negative amounts, invalid allocation totals, duplicate all-nonce collision UX, wallet rejection, RPC failure paths, confirmation mismatch.
- [ ] Run full gates: `NO_DNA=1 anchor test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- [ ] Optionally add a Surfpool/Knowns embedded integration test for the retryability (sequential duplicate attempts) and cross-sender scenarios.

### Approval checkpoint
Wait for approval.

---

## Phase 7 — Hackathon Demo

### Tasks
- [ ] Fund the deploy wallet on Devnet.
- [ ] `anchor deploy --provider.cluster devnet`; record the real deployed program ID (must match `GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ` or update everywhere: code, IDL, `.env.example`, Anchor.toml).
- [ ] Verify deployment: `solana program show`, quick end-to-end flow on Devnet.
- [ ] Point the frontend `.env` at Devnet + deployed program.
- [ ] Capture screenshots and record a demo video of the verified flow.
- [ ] Update the root `README.md` to match the real implementation.
- [ ] Document remaining limitations (SOL-only, allocation metadata only, no spending restrictions).

### Verify
- Devnet end-to-end with a real explorer-visible transaction; confirm refunds/settlement visible.

### Approval checkpoint
Final review.

---

## Definition of Done (MVP)

- Next.js frontend runs; wallet connects to Devnet.
- Anchor program builds and passes tests.
- User can create a supported test transfer; allocation rules enforced.
- Program enforces authorization and validation; unauthorized/invalid ops rejected.
- Transfer records verifiable on-chain; frontend shows real confirmed status + history.
- Another developer can reproduce the setup from the docs.
- Demo runs on test assets only.

## Glossary

- **Settlement record**: the on-chain account holding sender, recipient, amount, allocations, reference, and status.
- **Allocation**: a purpose + amount pair; metadata describing the intended split, not a separate fund transfer.
- **Nonce**: sender-chosen number making the `(sender, nonce)` PDA unique and replay-safe.
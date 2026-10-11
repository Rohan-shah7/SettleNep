"use client";

import { address, type Signature } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useAction, useClient } from "@solana/react";
import { useEffect, useMemo, useState } from "react";

import type { AppClient } from "@/app/providers";
import { formatSol, parseSolInput } from "@/lib/lamports";
import { CLUSTER, explorerAddressUrl, explorerTxUrl } from "@/lib/solana";
import { getCreateSettlementInstructionAsync } from "@/lib/settlenep/generated/instructions";
import { findSettlementPda } from "@/lib/settlenep/generated/pdas";
import { describeSendError } from "@/lib/settlenep/send-errors";
import {
  decodeReference,
  MAX_ALLOCATIONS,
  PURPOSES,
  PURPOSE_LABELS,
} from "@/lib/settlenep/utils";
import {
  type AllocationRow,
  type FormValidation,
  validateForm,
} from "@/lib/settlenep/validation";

type Phase = "form" | "review" | "result";

type SendArgs = {
  sender: string;
  recipient: string;
  amountLamports: bigint;
  reference: Uint8Array;
  allocations: Array<{ purpose: number; amount: bigint }>;
  nonce: bigint;
};

type SendResult = {
  signature: string;
  settlementAddress: string;
  amountLamports: bigint;
  allocations: Array<{ purpose: number; amount: bigint }>;
  reference: Uint8Array;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForConfirmation(
  client: AppClient,
  signature: Signature,
  signal: AbortSignal,
): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const { value } = await client.rpc
      .getSignatureStatuses([signature], {
        searchTransactionHistory: false,
      })
      .send({ abortSignal: signal });
    const status = value?.[0];
    if (status) {
      if (status.err) {
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
      }
      if (
        status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized"
      ) {
        return;
      }
    }
    await sleep(500);
  }
  throw new Error("Timed out waiting for the transaction to be confirmed.");
}

export function RemittanceForm() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const sender = connected?.account?.address;
  const canSignVersioned =
    connected?.supportedTransactionVersions.has(0) ?? false;

  const [phase, setPhase] = useState<Phase>("form");
  const [recipient, setRecipient] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  const [rows, setRows] = useState<AllocationRow[]>([
    { key: 1, purpose: PURPOSES[0].value, amount: "" },
  ]);
  const [nonce, setNonce] = useState(0n);
  const [pdaAddress, setPdaAddress] = useState<string | null>(null);

  const validation = useMemo(
    () => validateForm(recipient, amountInput, referenceInput, rows),
    [recipient, amountInput, referenceInput, rows],
  );

  const allocationTotal = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const lamports = parseSolInput(row.amount);
        return sum + (lamports ?? 0n);
      }, 0n),
    [rows],
  );

  useEffect(() => {
    if (phase !== "review" || !sender) {
      return;
    }
    let cancelled = false;
    void findSettlementPda({ sender: address(sender), nonce }).then(
      ([pda]) => {
        if (!cancelled) {
          setPdaAddress(pda);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [phase, sender, nonce]);

  const { dispatch, isRunning, error, data } = useAction(
    async (signal: AbortSignal, args: SendArgs): Promise<SendResult> => {
      const ix = await getCreateSettlementInstructionAsync({
        sender: client.payer,
        recipient: address(args.recipient),
        nonce: args.nonce,
        amount: args.amountLamports,
        reference: args.reference,
        allocations: args.allocations,
      });
      const { context } = await client.sendTransaction([ix], {
        abortSignal: signal,
      });
      const signature = context.signature;
      await waitForConfirmation(client, signature, signal);
      const [settlement] = await findSettlementPda({
        sender: address(args.sender),
        nonce: args.nonce,
      });
      const maybe = await client.settlenep.accounts.settlement.fetchMaybe(
        settlement,
        { commitment: "confirmed", abortSignal: signal },
      );
      if (!maybe.exists) {
        throw new Error("Settlement account not found after confirmation.");
      }
      return {
        signature,
        settlementAddress: settlement,
        amountLamports: args.amountLamports,
        allocations: args.allocations,
        reference: args.reference,
      };
    },
  );

  function enterReview() {
    if (!validation.valid || !sender) {
      return;
    }
    setNonce(BigInt(Date.now()));
    setPdaAddress(null);
    setPhase("review");
  }

  function approveAndSend() {
    if (!validation.valid || !sender || isRunning) {
      return;
    }
    const args: SendArgs = {
      sender,
      recipient: recipient.trim(),
      amountLamports: validation.amountLamports,
      reference: validation.reference ?? new Uint8Array(32),
      allocations: validation.allocations,
      nonce,
    };
    dispatch(args);
  }

  function resetForm() {
    setPhase("form");
    setRecipient("");
    setAmountInput("");
    setReferenceInput("");
    setRows([{ key: Date.now(), purpose: PURPOSES[0].value, amount: "" }]);
    setNonce(0n);
    setPdaAddress(null);
  }

  if (!sender) {
    return (
      <section className="rounded-3xl border border-dashed border-black/[.12] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
        <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          No wallet connected
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Connect a Solana wallet on {CLUSTER} to create a remittance. The wallet
          must hold SOL for the transfer, fees, and rent.
        </p>
      </section>
    );
  }

  if (phase === "result" && data) {
    return <ResultCard result={data} onReset={resetForm} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="rounded-3xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        {phase === "form" ? (
          <FormStep
            recipient={recipient}
            onRecipientChange={setRecipient}
            amountInput={amountInput}
            onAmountInputChange={setAmountInput}
            referenceInput={referenceInput}
            onReferenceInputChange={setReferenceInput}
            rows={rows}
            onRowsChange={setRows}
            allocationTotal={allocationTotal}
            validation={validation}
            valid={validation.valid}
            canSignVersioned={canSignVersioned}
            onReview={enterReview}
          />
        ) : (
          <ReviewStep
            sender={sender}
            recipient={recipient.trim()}
            validation={validation}
            nonce={nonce}
            pdaAddress={pdaAddress}
            reference={validation.reference}
            canSignVersioned={canSignVersioned}
            isRunning={isRunning}
            error={error ? describeSendError(error) : null}
            onApprove={approveAndSend}
            onEdit={() => setPhase("form")}
          />
        )}
      </section>

      <aside className="space-y-4">
        <InfoCard title="Allocation rules">
          <ul className="list-disc space-y-2 pl-4 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Every allocation needs a purpose and a positive amount.</li>
            <li>
              Allocation amounts must sum to the exact transfer amount.
            </li>
            <li>Up to {MAX_ALLOCATIONS} allocations per settlement.</li>
            <li>
              Allocations are a recorded plan; they do not restrict how the
              recipient spends the funds.
            </li>
          </ul>
        </InfoCard>
        <InfoCard title="On-chain settlement">
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Approving creates one transaction that records the settlement and
            transfers the full SOL amount to the recipient in the same block.
            The wallet pays the transfer amount, transaction fee, and settlement
            account rent.
          </p>
        </InfoCard>
      </aside>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600";

function FormStep({
  recipient,
  onRecipientChange,
  amountInput,
  onAmountInputChange,
  referenceInput,
  onReferenceInputChange,
  rows,
  onRowsChange,
  allocationTotal,
  validation,
  valid,
  canSignVersioned,
  onReview,
}: {
  recipient: string;
  onRecipientChange: (value: string) => void;
  amountInput: string;
  onAmountInputChange: (value: string) => void;
  referenceInput: string;
  onReferenceInputChange: (value: string) => void;
  rows: AllocationRow[];
  onRowsChange: (rows: AllocationRow[]) => void;
  allocationTotal: bigint;
  validation: FormValidation;
  valid: boolean;
  canSignVersioned: boolean;
  onReview: () => void;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          New remittance
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Define the recipient, amount, and allocation plan.
        </p>
      </header>

      <Field
        label="Recipient address"
        hint="The wallet that receives the SOL transfer."
        error={validation.errors.recipient}
      >
        <input
          type="text"
          value={recipient}
          onChange={(event) => onRecipientChange(event.target.value)}
          placeholder="Enter a Solana address"
          spellCheck={false}
          className={inputClass}
        />
      </Field>

      <Field
        label="Transfer amount"
        hint="Total SOL to move to the recipient."
        error={validation.errors.amount}
      >
        <input
          type="text"
          inputMode="decimal"
          value={amountInput}
          onChange={(event) => onAmountInputChange(event.target.value)}
          placeholder="0.1"
          className={inputClass}
        />
      </Field>

      <Field
        label="Reference"
        hint="Optional free text up to 32 characters, stored on-chain."
        error={validation.errors.reference}
      >
        <input
          type="text"
          value={referenceInput}
          onChange={(event) => onReferenceInputChange(event.target.value)}
          placeholder="e.g. March support"
          maxLength={32}
          className={inputClass}
        />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Allocations
          </span>
          <button
            type="button"
            onClick={() =>
              onRowsChange([
                ...rows,
                {
                  key: Date.now() + Math.random(),
                  purpose: PURPOSES[0].value,
                  amount: "",
                },
              ])
            }
            disabled={rows.length >= MAX_ALLOCATIONS}
            className="rounded-lg border border-black/[.08] px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-white/[.06]"
          >
            Add allocation
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <select
                value={row.purpose}
                onChange={(event) =>
                  onRowsChange(
                    rows.map((r) =>
                      r.key === row.key
                        ? { ...r, purpose: Number(event.target.value) }
                        : r,
                    ),
                  )
                }
                className={`${inputClass} w-40`}
              >
                {PURPOSES.map((purpose) => (
                  <option key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="decimal"
                value={row.amount}
                onChange={(event) =>
                  onRowsChange(
                    rows.map((r) =>
                      r.key === row.key
                        ? { ...r, amount: event.target.value }
                        : r,
                    ),
                  )
                }
                placeholder="0.00 SOL"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() =>
                  onRowsChange(rows.filter((r) => r.key !== row.key))
                }
                disabled={rows.length <= 1}
                title="Remove allocation"
                className="rounded-lg border border-black/[.08] px-2.5 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-black/[.04] disabled:opacity-40 dark:border-white/[.145] dark:text-zinc-400 dark:hover:bg-white/[.06]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-black/[.06] bg-black/[.02] px-3 py-2 text-sm dark:border-white/[.08] dark:bg-white/[.02]">
          <span className="text-zinc-600 dark:text-zinc-400">
            Allocation total
          </span>
          <span
            className={
              allocationTotal === (parseSolInput(amountInput) ?? 0n) &&
              allocationTotal > 0n
                ? "font-medium text-emerald-600 dark:text-emerald-400"
                : "font-medium text-zinc-900 dark:text-zinc-50"
            }
          >
            {allocationTotal > 0n ? formatSol(allocationTotal) : "—"}
          </span>
        </div>

        {validation.errors.allocations ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {validation.errors.allocations}
          </p>
        ) : null}
      </div>

      {!canSignVersioned ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          Your wallet does not advertise versioned transaction support. Update
          the wallet before sending a settlement.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onReview}
        disabled={!valid || !canSignVersioned}
        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Review settlement
      </button>
    </div>
  );
}

function ReviewStep({
  sender,
  recipient,
  validation,
  nonce,
  pdaAddress,
  reference,
  canSignVersioned,
  isRunning,
  error,
  onApprove,
  onEdit,
}: {
  sender: string;
  recipient: string;
  validation: FormValidation;
  nonce: bigint;
  pdaAddress: string | null;
  reference: Uint8Array | null;
  canSignVersioned: boolean;
  isRunning: boolean;
  error: string | null;
  onApprove: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Review settlement
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Confirm the exact transaction before approving it in your wallet.
        </p>
      </header>

      <dl className="space-y-3 text-sm">
        <Row label="From">
          <a
            href={explorerAddressUrl(sender)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
          >
            {sender}
          </a>
        </Row>
        <Row label="To">
          <a
            href={explorerAddressUrl(recipient)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
          >
            {recipient}
          </a>
        </Row>
        <Row label="Amount">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatSol(validation.amountLamports)}
          </span>
        </Row>
        <Row label="Reference">
          <span className="text-zinc-900 dark:text-zinc-50">
            {reference ? decodeReference(reference) : "None"}
          </span>
        </Row>
        <Row label="Allocations">
          <div className="mt-1 space-y-1">
            {validation.allocations.map((allocation, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-zinc-600 dark:text-zinc-400">
                  {PURPOSE_LABELS[allocation.purpose] ?? "Other"}
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-50">
                  {formatSol(allocation.amount)}
                </span>
              </div>
            ))}
          </div>
        </Row>
        <Row label="Nonce">
          <span className="font-mono text-zinc-900 dark:text-zinc-50">
            {nonce.toString()}
          </span>
        </Row>
        <Row label="Settlement account">
          <span className="break-all font-mono text-zinc-900 dark:text-zinc-50">
            {pdaAddress ?? "Computing…"}
            {pdaAddress ? (
              <>
                {" "}
                <a
                  href={explorerAddressUrl(pdaAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
                >
                  view
                </a>
              </>
            ) : null}
          </span>
        </Row>
      </dl>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {!canSignVersioned ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          This wallet cannot sign versioned transactions. Update the wallet
          first.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onApprove}
          disabled={isRunning || !canSignVersioned || pdaAddress == null}
          className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isRunning ? "Sending…" : "Approve and send"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={isRunning}
          className="rounded-full border border-black/[.08] px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-white/[.06]"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function ResultCard({
  result,
  onReset,
}: {
  result: SendResult;
  onReset: () => void;
}) {
  return (
    <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[.04] p-8 dark:bg-emerald-500/[.06]">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Settlement confirmed
      </p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {formatSol(result.amountLamports)} transferred
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        The transaction was confirmed on {CLUSTER} and the settlement record was
        read back from the chain.
      </p>

      <dl className="mt-6 space-y-3 text-sm">
        <Row label="Transaction">
          <a
            href={explorerTxUrl(result.signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {result.signature}
          </a>
        </Row>
        <Row label="Settlement account">
          <a
            href={explorerAddressUrl(result.settlementAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {result.settlementAddress}
          </a>
        </Row>
        <Row label="Reference">
          <span className="text-zinc-900 dark:text-zinc-50">
            {result.reference.some((byte) => byte !== 0)
              ? decodeReference(result.reference)
              : "None"}
          </span>
        </Row>
        <Row label="Allocations">
          <div className="mt-1 space-y-1">
            {result.allocations.map((allocation, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-zinc-600 dark:text-zinc-400">
                  {PURPOSE_LABELS[allocation.purpose] ?? "Other"}
                </span>
                <span className="font-mono text-zinc-900 dark:text-zinc-50">
                  {formatSol(allocation.amount)}
                </span>
              </div>
            ))}
          </div>
        </Row>
      </dl>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Create another remittance
      </button>
    </section>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
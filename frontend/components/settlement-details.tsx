import { formatSol } from "@/lib/lamports";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/solana";
import { S_E_T_T_L_E_D } from "@/lib/settlenep/generated/constants";
import type { SettlementRecord } from "@/lib/settlenep/history";
import { decodeReference, PURPOSE_LABELS, STATUS_LABELS } from "@/lib/settlenep/utils";

export function SettlementStatusBadge({ status }: { status: number }) {
  const className =
    status === S_E_T_T_L_E_D
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : status === 0
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {STATUS_LABELS[status] ?? `Status ${status}`}
    </span>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

export function SettlementDetails({ record }: { record: SettlementRecord }) {
  const { settlement } = record;
  const allocations = settlement.allocations.slice(0, settlement.allocationCount);
  const reference = decodeReference(settlement.reference);
  const createdAt = new Date(Number(settlement.createdAt) * 1000);

  return (
    <dl className="space-y-4 text-sm">
      <DetailRow label="Settlement account">
        <a
          href={explorerAddressUrl(record.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-mono text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          {record.address}
        </a>
      </DetailRow>
      <DetailRow label="Sender">
        <span className="break-all font-mono text-zinc-900 dark:text-zinc-50">
          {settlement.sender}
        </span>
      </DetailRow>
      <DetailRow label="Recipient">
        <span className="break-all font-mono text-zinc-900 dark:text-zinc-50">
          {settlement.recipient}
        </span>
      </DetailRow>
      <DetailRow label="Amount">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {formatSol(settlement.amount)}
        </span>
      </DetailRow>
      <DetailRow label="Allocations">
        <div className="mt-1 space-y-1">
          {allocations.map((allocation, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <span className="text-zinc-600 dark:text-zinc-400">
                {PURPOSE_LABELS[allocation.purpose] ?? "Other"}
              </span>
              <span className="font-mono text-zinc-900 dark:text-zinc-50">
                {formatSol(allocation.amount)}
              </span>
            </div>
          ))}
        </div>
      </DetailRow>
      <DetailRow label="Reference">
        <span className="text-zinc-900 dark:text-zinc-50">
          {reference || "None"}
        </span>
      </DetailRow>
      <DetailRow label="Nonce">
        <span className="font-mono text-zinc-900 dark:text-zinc-50">
          {settlement.nonce.toString()}
        </span>
      </DetailRow>
      <DetailRow label="Created">
        <span className="text-zinc-900 dark:text-zinc-50">
          {Number.isNaN(createdAt.getTime())
            ? "Unknown"
            : createdAt.toLocaleString()}
        </span>
      </DetailRow>
      <DetailRow label="Transaction">
        {record.signature ? (
          <span className="flex flex-col gap-1">
            <a
              href={explorerTxUrl(record.signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-mono text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              {record.signature}
            </a>
            {record.confirmationStatus ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {record.confirmationStatus}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-zinc-500 dark:text-zinc-400">
            Unavailable
          </span>
        )}
      </DetailRow>
    </dl>
  );
}
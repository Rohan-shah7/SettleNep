export const LAMPORTS_PER_SOL = 1_000_000_000n;

const NUMBER_PATTERN = /^\d*(\.\d*)?$/;

// Parses a user-entered SOL amount into lamports without floating-point math.
// Returns null when the input is not a non-negative decimal with at most 9
// fractional digits.
export function parseSolInput(input: string): bigint | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (trimmed === "" || !NUMBER_PATTERN.test(trimmed)) {
    return null;
  }
  const [whole = "", fraction = ""] = trimmed.split(".");
  const fractionDigits = fraction.slice(0, 9);
  if (fraction.length > 9 && fraction[9] !== undefined) {
    return null;
  }
  const trimmedFraction = fractionDigits.padEnd(9, "0");
  const lamportsText = `${whole}${trimmedFraction}` || "0";
  const lamports = BigInt(lamportsText);
  if (lamports < 0n || fraction.length > 9) {
    return null;
  }
  return lamports;
}

// Displays a lamports value as a compact SOL string.
export function formatSol(lamports: bigint): string {
  const negative = lamports < 0n;
  const absolute = negative ? -lamports : lamports;
  const whole = absolute / LAMPORTS_PER_SOL;
  const fraction = (absolute % LAMPORTS_PER_SOL)
    .toString()
    .padStart(9, "0")
    .replace(/0+$/, "");
  if (fraction === "") {
    return `${negative ? "-" : ""}${whole} SOL`;
  }
  return `${negative ? "-" : ""}${whole}.${fraction} SOL`;
}
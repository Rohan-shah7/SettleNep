import { describe, expect, it } from "vitest";

import { formatSol, parseSolInput } from "@/lib/lamports";

describe("parseSolInput", () => {
  it("parses whole SOL into lamports", () => {
    expect(parseSolInput("1")).toBe(1_000_000_000n);
    expect(parseSolInput("0")).toBe(0n);
  });

  it("parses fractional SOL with up to 9 digits", () => {
    expect(parseSolInput("1.5")).toBe(1_500_000_000n);
    expect(parseSolInput("0.123456789")).toBe(123_456_789n);
  });

  it("parses a trailing empty decimal part", () => {
    expect(parseSolInput("5.")).toBe(5_000_000_000n);
  });

  it("ignores comma thousand separators", () => {
    expect(parseSolInput("1,000")).toBe(1_000_000_000_000n);
  });

  it("rejects more than 9 decimal places", () => {
    expect(parseSolInput("1.1234567890")).toBeNull();
  });

  it("rejects negative values", () => {
    expect(parseSolInput("-1")).toBeNull();
    expect(parseSolInput("-0.5")).toBeNull();
  });

  it("rejects empty, whitespace, and non-numeric input", () => {
    expect(parseSolInput("")).toBeNull();
    expect(parseSolInput("   ")).toBeNull();
    expect(parseSolInput("abc")).toBeNull();
    expect(parseSolInput("1abc")).toBeNull();
  });
});

describe("formatSol", () => {
  it("formats whole SOL without decimals", () => {
    expect(formatSol(1_000_000_000n)).toBe("1 SOL");
    expect(formatSol(0n)).toBe("0 SOL");
  });

  it("formats fractional SOL, trimming trailing zeros", () => {
    expect(formatSol(1_500_000_000n)).toBe("1.5 SOL");
    expect(formatSol(123_456_789n)).toBe("0.123456789 SOL");
  });

  it("formats negative amounts", () => {
    expect(formatSol(-500_000_000n)).toBe("-0.5 SOL");
  });
});
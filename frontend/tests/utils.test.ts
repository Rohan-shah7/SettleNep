import { describe, expect, it } from "vitest";

import {
  decodeReference,
  encodeReference,
  MAX_ALLOCATIONS,
} from "@/lib/settlenep/utils";

describe("encodeReference", () => {
  it("encodes ASCII text into a zero-padded 32-byte field", () => {
    const bytes = encodeReference("invoice-12345");
    expect(bytes).not.toBeNull();
    expect(bytes!.length).toBe(32);
    expect(decodeReference(bytes!)).toBe("invoice-12345");
  });

  it("round-trips exactly 32 characters", () => {
    const text = "a".repeat(32);
    const bytes = encodeReference(text);
    expect(bytes).not.toBeNull();
    expect(decodeReference(bytes!)).toBe(text);
  });

  it("trims surrounding whitespace", () => {
    const bytes = encodeReference("  hello  ");
    expect(decodeReference(bytes!)).toBe("hello");
  });

  it("rejects text longer than 32 bytes, including multi-byte characters", () => {
    expect(encodeReference("a".repeat(33))).toBeNull();
    expect(encodeReference("café".repeat(8))).toBeNull();
  });
});

describe("MAX_ALLOCATIONS", () => {
  it("matches the on-chain limit of 8", () => {
    expect(MAX_ALLOCATIONS).toBe(8);
  });
});

describe("decodeReference", () => {
  it("handles an all-zero reference as empty", () => {
    expect(decodeReference(new Uint8Array(32))).toBe("");
  });
});
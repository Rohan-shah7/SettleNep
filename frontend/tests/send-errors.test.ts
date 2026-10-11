import { describe, expect, it } from "vitest";

import {
  classifySendErrorMessage,
  describeSendError,
  unwrapSendError,
} from "@/lib/settlenep/send-errors";

describe("classifySendErrorMessage", () => {
  it.each([
    "User rejected the request",
    "The request was declined",
    "Signature denied by user",
    "Transaction cancelled",
    "canceled by user",
  ])("classifies a wallet rejection: %s", (message) => {
    expect(classifySendErrorMessage(message)).toBe(
      "The signature request was rejected in your wallet. Nothing was sent.",
    );
  });

  it.each([
    "insufficient funds for fees",
    "insufficient lamports 1234",
    "not enough SOL to cover the fee",
  ])("classifies insufficient funds: %s", (message) => {
    expect(classifySendErrorMessage(message)).toBe(
      "Your wallet does not have enough SOL to cover the transfer and fees.",
    );
  });

  it.each([
    "TypeError: fetch failed",
    "Failed to fetch",
    "network request failed",
    "ECONNREFUSED 127.0.0.1:8899",
    "connection refused",
    "bad port",
    "The request timed out",
    "429 Too Many Requests",
    "502 Bad Gateway",
  ])("classifies an RPC failure: %s", (message) => {
    expect(classifySendErrorMessage(message)).toBe(
      "Could not reach the Solana RPC. Check your connection and try again.",
    );
  });

  it("returns null for unrecognized messages", () => {
    expect(classifySendErrorMessage("Something else happened")).toBeNull();
  });
});

describe("describeSendError", () => {
  it("returns unrecognized error messages as-is", () => {
    expect(describeSendError(new Error("Simulation failed"))).toBe(
      "Simulation failed",
    );
  });

  it("classifies wallet rejection", () => {
    expect(describeSendError(new Error("User rejected the request"))).toBe(
      "The signature request was rejected in your wallet. Nothing was sent.",
    );
  });

  it("classifies RPC failure", () => {
    expect(describeSendError(new Error("fetch failed"))).toBe(
      "Could not reach the Solana RPC. Check your connection and try again.",
    );
  });

  it("stringifies non-Error values", () => {
    expect(describeSendError({ code: 42 })).toBe("[object Object]");
    expect(describeSendError(null)).toBe("null");
    expect(describeSendError(undefined)).toBe("undefined");
  });

  it("maps a bare program error code to the friendly message", () => {
    expect(describeSendError(new Error("Custom program error: #6005 (instruction #2)"))).toBe(
      "A settlement with this sender and nonce already exists. Change the nonce or wait a moment and retry.",
    );
  });

  it("unwraps nested cause chains to the primary error", () => {
    const inner = new Error("User rejected the request");
    const outer = new Error("Processing failed", { cause: inner });
    expect(unwrapSendError(outer)).toBe(inner);
    expect(describeSendError(outer)).toBe(
      "The signature request was rejected in your wallet. Nothing was sent.",
    );
  });

  it("unwrapping stops at cycles and primitives", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.cause = cyclic;
    expect(unwrapSendError(cyclic)).toBe(cyclic);
    expect(unwrapSendError("plain string")).toBe("plain string");
    expect(unwrapSendError(null)).toBeNull();
  });
});
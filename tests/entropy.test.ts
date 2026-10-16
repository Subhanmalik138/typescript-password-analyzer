import { describe, it, expect } from "vitest";
import { charsetInfo, charsetEntropy, shannonEntropyPerChar } from "../src/entropy.js";

describe("charsetInfo", () => {
  it("detects a lowercase-only pool", () => {
    expect(charsetInfo("abc")).toEqual({ size: 26, classes: ["lowercase"] });
  });

  it("sums pools for mixed classes", () => {
    // 26 lower + 26 upper + 10 digits + 33 symbols
    expect(charsetInfo("aB1!")).toEqual({
      size: 95,
      classes: ["lowercase", "uppercase", "digits", "symbols"],
    });
  });

  it("credits a generous pool for non-ASCII input", () => {
    const info = charsetInfo("pässwörd");
    expect(info.classes).toContain("unicode");
    expect(info.size).toBeGreaterThan(26);
  });

  it("returns an empty pool for an empty password", () => {
    expect(charsetInfo("")).toEqual({ size: 0, classes: [] });
  });
});

describe("charsetEntropy", () => {
  it("is length * log2(pool size)", () => {
    expect(charsetEntropy("aaaa")).toBeCloseTo(4 * Math.log2(26), 10);
  });

  it("is zero for an empty password", () => {
    expect(charsetEntropy("")).toBe(0);
  });
});

describe("shannonEntropyPerChar", () => {
  it("is zero for a single repeated character", () => {
    expect(shannonEntropyPerChar("aaaa")).toBe(0);
  });

  it("is 1 bit for a fair coin-flip string", () => {
    expect(shannonEntropyPerChar("ab")).toBeCloseTo(1, 10);
  });
});

import { describe, it, expect } from "vitest";
import { analyze } from "../src/analyzer.js";

describe("analyze", () => {
  it("scores the world's most common password as very weak", () => {
    const r = analyze("password");
    expect(r.score).toBe(0);
    expect(r.label).toBe("Very weak");
    expect(r.warnings.join(" ")).toMatch(/most common/);
  });

  it("sees through leet-speak variants of common passwords", () => {
    const r = analyze("P@ssw0rd");
    expect(r.score).toBe(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("penalizes keyboard walks and sequences", () => {
    const r = analyze("qwerty123");
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.patterns.map((p) => p.type)).toContain("keyboard");
    expect(r.entropyBits).toBeLessThan(r.rawEntropyBits);
  });

  it("handles an empty password gracefully", () => {
    const r = analyze("");
    expect(r.score).toBe(0);
    expect(r.entropyBits).toBe(0);
    expect(r.warnings).toHaveLength(1);
  });

  it("scores a long random password as very strong", () => {
    const r = analyze("v9#Lm2$qW7!zX4&kP6d");
    expect(r.score).toBe(4);
    expect(r.label).toBe("Very strong");
    expect(r.patterns).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it("gives actionable suggestions for weak passwords", () => {
    const r = analyze("abc123");
    expect(r.suggestions.length).toBeGreaterThan(0);
    expect(r.suggestions.join(" ")).toMatch(/12 characters|passphrase|dictionary/i);
  });

  it("reports crack times across scenarios", () => {
    const r = analyze("correct horse battery staple".replaceAll(" ", ""));
    expect(r.crackTimes).toHaveLength(4);
    for (const c of r.crackTimes) expect(c.display).toBeTruthy();
  });

  it("never echoes the password back in the result", () => {
    const r = analyze("s3cret!");
    expect(JSON.stringify(r)).not.toContain("s3cret!");
  });
});

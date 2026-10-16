import { describe, it, expect } from "vitest";
import { formatDuration, estimateCrackTimes } from "../src/crackTime.js";

describe("formatDuration", () => {
  it("handles sub-second durations", () => {
    expect(formatDuration(0.5)).toBe("less than a second");
  });

  it("uses singular and plural correctly", () => {
    expect(formatDuration(1)).toBe("1 second");
    expect(formatDuration(45)).toBe("45 seconds");
    expect(formatDuration(60)).toBe("1 minute");
    expect(formatDuration(5 * 3600)).toBe("5 hours");
    expect(formatDuration(3 * 86400)).toBe("3 days");
  });

  it("caps absurd durations at centuries", () => {
    expect(formatDuration(Infinity)).toBe("centuries");
    expect(formatDuration(1e12 * 31536000)).toBe("centuries");
  });
});

describe("estimateCrackTimes", () => {
  it("reports all four scenarios", () => {
    const estimates = estimateCrackTimes(1e10);
    expect(estimates).toHaveLength(4);
    expect(estimates.map((e) => e.scenario)).toEqual([
      "Online attack, throttled (100/hr)",
      "Online attack, unthrottled (10/s)",
      "Offline attack, slow hash like bcrypt (10k/s)",
      "Offline attack, fast hash like MD5 (10B/s)",
    ]);
  });

  it("a fast hash cracks 1e10 guesses in about a second", () => {
    const fast = estimateCrackTimes(1e10)[3]!;
    expect(fast.display).toBe("1 second");
  });
});

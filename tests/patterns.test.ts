import { describe, it, expect } from "vitest";
import {
  dictionaryMatch,
  findKeyboardWalks,
  findRepeats,
  findSequences,
  findDates,
  leetNormalize,
  detectPatterns,
} from "../src/patterns.js";

describe("leetNormalize", () => {
  it("maps common substitutions back to letters", () => {
    expect(leetNormalize("P@ssw0rd!")).toBe("passwordi");
    // "1" reads as "l", consistently on both sides of the dictionary lookup
    expect(leetNormalize("7rU57n01")).toBe("trustnol");
  });
});

describe("dictionaryMatch", () => {
  it("finds an exact hit on a top password", () => {
    expect(dictionaryMatch("password")).toMatchObject({ word: "password", rank: 0, exact: true });
  });

  it("sees through leet-speak", () => {
    expect(dictionaryMatch("P@ssw0rd")).toMatchObject({ word: "password", exact: true });
  });

  it("finds a dictionary word embedded in a longer password", () => {
    const hit = dictionaryMatch("hunter2hunter2");
    expect(hit).toMatchObject({ word: "hunter", exact: false });
  });

  it("returns null for a genuinely random password", () => {
    expect(dictionaryMatch("xK9#mQ2$vLzT7!")).toBeNull();
  });
});

describe("findKeyboardWalks", () => {
  it("detects straight rows", () => {
    expect(findKeyboardWalks("qwerty123")).toContain("qwerty");
  });

  it("detects diagonal walks like 1qaz", () => {
    // "!" is not on the keyboard grid, so the walk ends cleanly at "z"
    expect(findKeyboardWalks("1qaz!")).toEqual(["1qaz"]);
  });

  it("ignores short runs", () => {
    expect(findKeyboardWalks("qwe")).toEqual([]);
  });

  it("finds nothing in random input", () => {
    expect(findKeyboardWalks("xK9#mQ2$vLzT7!")).toEqual([]);
  });
});

describe("findRepeats", () => {
  it("finds runs of the same character", () => {
    expect(findRepeats("aaabbb")).toEqual(["aaa", "bbb"]);
  });

  it("ignores pairs", () => {
    expect(findRepeats("aabb")).toEqual([]);
  });
});

describe("findSequences", () => {
  it("finds ascending letter runs", () => {
    expect(findSequences("xxabcdefxx")).toEqual(["abcdef"]);
  });

  it("finds descending digit runs", () => {
    expect(findSequences("xx3210xx")).toEqual(["3210"]);
  });

  it("does not cross character classes", () => {
    expect(findSequences("a1b2")).toEqual([]);
  });
});

describe("findDates", () => {
  it("flags plausible years", () => {
    expect(findDates("born1990!")).toContain("1990");
  });

  it("flags long digit runs as date-like", () => {
    expect(findDates("x25122025x")).toContain("25122025");
  });
});

describe("detectPatterns", () => {
  it("aggregates findings with bit penalties", () => {
    const findings = detectPatterns("qwerty1990");
    const types = findings.map((f) => f.type);
    expect(types).toContain("keyboard");
    expect(types).toContain("date");
    for (const f of findings) expect(f.penaltyBits).toBeGreaterThan(0);
  });

  it("is clean for random input", () => {
    expect(detectPatterns("xK9#mQ2$vLzT7!")).toEqual([]);
  });
});

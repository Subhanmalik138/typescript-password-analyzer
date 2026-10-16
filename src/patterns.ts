// Detection of guessable patterns: dictionary words (leet-aware), keyboard
// walks, repeated characters, sequential runs, and date-like numbers.

import { COMMON_PASSWORDS } from "./commonPasswords.js";

export type PatternType = "dictionary" | "keyboard" | "repeat" | "sequence" | "date";

export interface PatternFinding {
  type: PatternType;
  /** The offending substring, as typed. */
  token: string;
  /** Bits of entropy subtracted from the password's score. */
  penaltyBits: number;
  message: string;
}

export interface DictionaryMatch {
  word: string;
  /** Position in COMMON_PASSWORDS — lower means more common. */
  rank: number;
  exact: boolean;
}

// ---------------------------------------------------------------------------
// Leet normalization
// ---------------------------------------------------------------------------

const LEET: Record<string, string> = {
  "@": "a",
  "4": "a",
  "3": "e",
  "1": "l",
  "!": "i",
  "0": "o",
  $: "s",
  "5": "s",
  "7": "t",
  "+": "t",
  "8": "b",
  "9": "g",
  "6": "g",
  "2": "z",
};

/** Map common leet-speak substitutions back to letters, lowercase. */
export function leetNormalize(s: string): string {
  return [...s.toLowerCase()].map((ch) => LEET[ch] ?? ch).join("");
}

/**
 * Find the most common dictionary word inside the password. Both the password
 * and the dictionary are leet-normalized first, so substitutions are matched
 * consistently in both directions (e.g. "7rU57n01" and "trustno1" both
 * normalize to "trustnol").
 */
export function dictionaryMatch(password: string): DictionaryMatch | null {
  const norm = leetNormalize(password);
  let best: DictionaryMatch | null = null;
  for (let rank = 0; rank < COMMON_PASSWORDS.length; rank++) {
    const word = COMMON_PASSWORDS[rank]!;
    const wordNorm = leetNormalize(word);
    if (wordNorm.length < 4) continue;
    if (norm === wordNorm) {
      if (!best || rank < best.rank) best = { word, rank, exact: true };
    } else if (norm.includes(wordNorm)) {
      if (!best || rank < best.rank) best = { word, rank, exact: false };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Keyboard walks (qwerty adjacency graph)
// ---------------------------------------------------------------------------

const KEYBOARD_ROWS = ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./"];

function buildAdjacency(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const pos = new Map<string, [number, number]>();
  KEYBOARD_ROWS.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      pos.set(ch, [r, c]);
      map.set(ch, new Set());
    });
  });
  // King moves on the keyboard grid: horizontal, vertical, and diagonal
  // neighbors are all one "step" for a walk like 1qaz or qazwsx.
  for (const [ch, [r, c]] of pos) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const neighbor = KEYBOARD_ROWS[r + dr]?.[c + dc];
        if (neighbor) map.get(ch)!.add(neighbor);
      }
    }
  }
  return map;
}

const ADJACENCY = buildAdjacency();

/** Maximal runs of adjacent keys, e.g. "qwerty", "1qaz", "zxcvbn". */
export function findKeyboardWalks(password: string, minLength = 4): string[] {
  const lower = password.toLowerCase();
  const walks: string[] = [];
  let i = 0;
  while (i < lower.length) {
    let j = i + 1;
    while (j < lower.length && ADJACENCY.get(lower[j - 1])?.has(lower[j])) j++;
    if (j - i >= minLength) walks.push(password.slice(i, j));
    i = j > i + 1 ? j : i + 1;
  }
  return walks;
}

// ---------------------------------------------------------------------------
// Repeats, sequences, dates
// ---------------------------------------------------------------------------

/** Runs of the same character, e.g. "aaa", "1111". */
export function findRepeats(password: string, minRun = 3): string[] {
  const pattern = new RegExp(`(.)\\1{${minRun - 1},}`, "g");
  return password.match(pattern) ?? [];
}

function isLetter(ch: string): boolean {
  return ch >= "a" && ch <= "z";
}
function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

/** Ascending/descending runs of letters or digits, e.g. "abcd", "3210". */
export function findSequences(password: string, minLength = 3): string[] {
  const lower = password.toLowerCase();
  const seqs: string[] = [];
  let i = 0;
  while (i < lower.length - 1) {
    const step = lower.charCodeAt(i + 1) - lower.charCodeAt(i);
    const stepped =
      Math.abs(step) === 1 &&
      ((isLetter(lower[i]) && isLetter(lower[i + 1])) ||
        (isDigit(lower[i]) && isDigit(lower[i + 1])));
    if (stepped) {
      let j = i + 1;
      while (
        j + 1 < lower.length &&
        lower.charCodeAt(j + 1) - lower.charCodeAt(j) === step &&
        ((isLetter(lower[j]) && isLetter(lower[j + 1])) ||
          (isDigit(lower[j]) && isDigit(lower[j + 1])))
      ) {
        j++;
      }
      if (j - i + 1 >= minLength) seqs.push(password.slice(i, j + 1));
      i = j + 1;
    } else {
      i++;
    }
  }
  return seqs;
}

/** Year-like and date-like numbers, e.g. "1990", "25122025". */
export function findDates(password: string): string[] {
  const hits: string[] = [];
  for (const m of password.match(/(19|20)\d{2}/g) ?? []) hits.push(m);
  for (const m of password.match(/\d{6,8}/g) ?? []) {
    if (!hits.includes(m)) hits.push(m);
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** All structural findings, each carrying its entropy penalty in bits. */
export function detectPatterns(password: string): PatternFinding[] {
  const findings: PatternFinding[] = [];

  for (const token of findKeyboardWalks(password)) {
    findings.push({
      type: "keyboard",
      token,
      penaltyBits: 10 + 2 * (token.length - 4),
      message: `Straight keyboard walk "${token}" is easy to guess.`,
    });
  }
  for (const token of findRepeats(password)) {
    findings.push({
      type: "repeat",
      token,
      penaltyBits: 8,
      message: `Repeated characters like "${token}" are easy to guess.`,
    });
  }
  for (const token of findSequences(password)) {
    findings.push({
      type: "sequence",
      token,
      penaltyBits: 10,
      message: `Sequential characters like "${token}" are easy to guess.`,
    });
  }
  for (const token of findDates(password)) {
    findings.push({
      type: "date",
      token,
      penaltyBits: 12,
      message: `Date-like number "${token}" is a common guess.`,
    });
  }
  return findings;
}

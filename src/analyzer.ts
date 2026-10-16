// Main analysis: combine charset entropy with pattern penalties to score a
// password 0–4, and explain the verdict with warnings and suggestions.

import { charsetInfo, charsetEntropy } from "./entropy.js";
import { detectPatterns, dictionaryMatch, type PatternFinding } from "./patterns.js";
import { estimateCrackTimes, type CrackTimeEstimate } from "./crackTime.js";

export interface AnalysisResult {
  length: number;
  charsetSize: number;
  charsets: string[];
  /** Entropy after pattern penalties — the number the score is based on. */
  entropyBits: number;
  /** Raw charset entropy before penalties. */
  rawEntropyBits: number;
  /** log10 of the estimated guesses needed. */
  guessesLog10: number;
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  crackTimes: CrackTimeEstimate[];
  warnings: string[];
  suggestions: string[];
  patterns: PatternFinding[];
}

const LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;

/** Score thresholds in log10(guesses): 1k, 1M, 100M, 10B. */
function scoreFromGuessesLog10(g: number): 0 | 1 | 2 | 3 | 4 {
  if (g < 3) return 0;
  if (g < 6) return 1;
  if (g < 8) return 2;
  if (g < 10) return 3;
  return 4;
}

function pushUnique(list: string[], item: string): void {
  if (!list.includes(item)) list.push(item);
}

export function analyze(password: string): AnalysisResult {
  const { size, classes } = charsetInfo(password);
  const rawEntropyBits = charsetEntropy(password);
  const patterns = detectPatterns(password);
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (password.length === 0) {
    return {
      length: 0,
      charsetSize: 0,
      charsets: [],
      entropyBits: 0,
      rawEntropyBits: 0,
      guessesLog10: 0,
      score: 0,
      label: LABELS[0],
      crackTimes: estimateCrackTimes(1),
      warnings: ["Password is empty."],
      suggestions: ["Choose a password of at least 12 characters."],
      patterns: [],
    };
  }

  let effective = rawEntropyBits;

  // Dictionary hits hurt the most: an exact hit on a top-N password caps
  // the guess count at rank * 10 (attackers try these first). A word buried
  // inside a longer password still costs bits proportional to its length —
  // "P@ssw0rd123" is not strong just because it has symbols in it.
  const match = dictionaryMatch(password);
  if (match) {
    if (match.exact) {
      effective = Math.min(effective, Math.log2((match.rank + 1) * 10));
      warnings.push(`"${match.word}" is one of the most common passwords in use.`);
    } else {
      effective -= 12 + 3 * match.word.length;
      warnings.push(`Contains the common password "${match.word}".`);
    }
    pushUnique(suggestions, "Avoid common passwords and dictionary words entirely.");
  }

  for (const p of patterns) {
    effective -= p.penaltyBits;
    warnings.push(p.message);
  }
  effective = Math.max(effective, 0.5);

  if (patterns.some((p) => p.type === "keyboard" || p.type === "sequence" || p.type === "repeat")) {
    pushUnique(suggestions, "Avoid predictable sequences, keyboard walks, and repeated characters.");
  }
  if (patterns.some((p) => p.type === "date")) {
    pushUnique(suggestions, "Dates and years are among the first things attackers try.");
  }
  if (password.length < 12) {
    pushUnique(suggestions, "Make it at least 12 characters long — length beats complexity.");
  }
  if (classes.length < 3) {
    pushUnique(suggestions, "Mix uppercase, lowercase, digits, and symbols.");
  }

  const guesses = Math.pow(2, effective);
  // log10(2^effective) = effective * log10(2)
  const guessesLog10 = effective * Math.log10(2);
  const score = scoreFromGuessesLog10(guessesLog10);

  if (score <= 2) {
    pushUnique(suggestions, "Consider a passphrase: four or more random, unrelated words.");
  }
  if (score === 4 && warnings.length === 0) {
    pushUnique(suggestions, "Strong password — store it in a password manager, don't reuse it.");
  }

  return {
    length: password.length,
    charsetSize: size,
    charsets: classes,
    entropyBits: Math.round(effective * 10) / 10,
    rawEntropyBits: Math.round(rawEntropyBits * 10) / 10,
    guessesLog10: Math.round(guessesLog10 * 100) / 100,
    score,
    label: LABELS[score],
    crackTimes: estimateCrackTimes(guesses),
    warnings,
    suggestions,
    patterns,
  };
}

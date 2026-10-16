// Entropy estimation for password strength analysis.

export interface CharsetInfo {
  /** Number of distinct characters an attacker must search per position. */
  size: number;
  /** Human-readable names of the character classes present. */
  classes: string[];
}

const SYMBOLS = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ ";

/** Which character classes a password uses, and the resulting pool size. */
export function charsetInfo(password: string): CharsetInfo {
  let hasLower = false;
  let hasUpper = false;
  let hasDigit = false;
  let hasSymbol = false;
  let hasOther = false;

  for (const ch of password) {
    if (ch >= "a" && ch <= "z") hasLower = true;
    else if (ch >= "A" && ch <= "Z") hasUpper = true;
    else if (ch >= "0" && ch <= "9") hasDigit = true;
    else if (SYMBOLS.includes(ch)) hasSymbol = true;
    else hasOther = true;
  }

  const classes: string[] = [];
  let size = 0;
  if (hasLower) {
    classes.push("lowercase");
    size += 26;
  }
  if (hasUpper) {
    classes.push("uppercase");
    size += 26;
  }
  if (hasDigit) {
    classes.push("digits");
    size += 10;
  }
  if (hasSymbol) {
    classes.push("symbols");
    size += SYMBOLS.length;
  }
  if (hasOther) {
    // Non-ASCII input (accents, CJK, emoji…): credit a generous pool so
    // passphrases in other scripts are not undervalued.
    classes.push("unicode");
    size += 1000;
  }
  return { size, classes };
}

/**
 * Brute-force search-space entropy: length * log2(pool size).
 * This models how an attacker actually guesses (charset^length), unlike
 * Shannon entropy which undervalues structured-but-long passwords.
 */
export function charsetEntropy(password: string): number {
  const { size } = charsetInfo(password);
  if (password.length === 0 || size <= 1) return 0;
  return password.length * Math.log2(size);
}

/** Per-character Shannon entropy — useful as a randomness sanity check. */
export function shannonEntropyPerChar(password: string): number {
  if (password.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const ch of password) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let h = 0;
  for (const count of freq.values()) {
    const p = count / password.length;
    h -= p * Math.log2(p);
  }
  return h;
}

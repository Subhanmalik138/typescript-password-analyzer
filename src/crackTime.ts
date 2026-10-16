// Crack-time estimates across realistic attack scenarios. One number lies:
// a password that survives a throttled online attack may fall instantly to
// an offline GPU cluster, so we report both.

export interface CrackTimeEstimate {
  scenario: string;
  guessesPerSecond: number;
  /** Human-readable duration, e.g. "3 hours", "centuries". */
  display: string;
}

export const SCENARIOS: { scenario: string; guessesPerSecond: number }[] = [
  { scenario: "Online attack, throttled (100/hr)", guessesPerSecond: 100 / 3600 },
  { scenario: "Online attack, unthrottled (10/s)", guessesPerSecond: 10 },
  { scenario: "Offline attack, slow hash like bcrypt (10k/s)", guessesPerSecond: 1e4 },
  { scenario: "Offline attack, fast hash like MD5 (10B/s)", guessesPerSecond: 1e10 },
];

/** Turn a duration in seconds into a human-readable string. */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "centuries";
  if (seconds < 1) return "less than a second";
  const s = Math.floor(seconds);
  if (s < 60) return `${s} second${s === 1 ? "" : "s"}`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"}`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d} day${d === 1 ? "" : "s"}`;
  const y = Math.floor(d / 365);
  if (y < 100) return `${y} year${y === 1 ? "" : "s"}`;
  return "centuries";
}

/** Estimated time to crack, per scenario, given a total guess count. */
export function estimateCrackTimes(guesses: number): CrackTimeEstimate[] {
  return SCENARIOS.map(({ scenario, guessesPerSecond }) => ({
    scenario,
    guessesPerSecond,
    display: formatDuration(guesses / guessesPerSecond),
  }));
}

# Password Strength Analyzer

Most strength meters are regex checklists: add a symbol, get a green bar. Attackers don't guess that way — they try the most common passwords first, then keyboard walks and dates, and only then brute force. This analyzer scores passwords the way they'd actually be attacked.

## How it works

1. **Charset entropy** — `length × log2(pool size)` from the character classes actually used. This models the real brute-force search space.
2. **Pattern penalties** — each guessable pattern found subtracts bits of entropy instead of triggering a hard rule:
   - dictionary words, matched **leet-aware** (`P@ssw0rd` → `password`) against a ranked common-password list; an exact hit caps guesses at `rank × 10`
   - keyboard walks, found via a **qwerty adjacency graph** (catches rows like `qwerty` and diagonals like `1qaz`)
   - repeated characters (`aaa`), sequential runs (`abcd`, `3210`), date-like numbers (`1990`, `25122025`)
3. **Score 0–4** from `log10(guesses)` at the 1k / 1M / 100M / 10B thresholds.
4. **Crack-time estimates across four scenarios** — throttled online (100/hr), unthrottled online (10/s), offline slow hash like bcrypt (10k/s), offline fast hash like MD5 (10B/s). One number lies; four tell the story.

## Design decisions

- **Charset entropy over Shannon entropy as the base.** Shannon entropy rewards gibberish but undervalues structured-yet-long passwords; the charset model matches how guessers enumerate the search space.
- **Penalties, not vetoes.** A password with one flaw isn't "weak" — it loses bits proportional to the flaw, so `Tr0ub4dor&3`-style passwords score honestly instead of gaming a checklist.
- **Leet normalization before dictionary lookup.** `M0nk3y` is `monkey` to an attacker with a substitution rule; the analyzer treats it the same way.
- **The result never echoes the password.** The analysis object contains no copy of the input, so JSON output is safe to log.

## Run it

```bash
npm install
npm run build
node dist/cli.js "P@ssw0rd123"
node dist/cli.js --json "correct horse battery staple"
echo "hunter2" | node dist/cli.js --stdin
```

Sample output:

```
Strength : ███░░ Fair (2/4)
Entropy  : 26.3 bits over 11 chars (lowercase, uppercase, digits, symbols)
Crack time estimates:
  - Online attack, throttled (100/hr): 92 years
  - Online attack, unthrottled (10/s): 93 days
  - Offline attack, slow hash like bcrypt (10k/s): 2 hours
  - Offline attack, fast hash like MD5 (10B/s): less than a second
Warnings:
  ! Contains the common password "password".
  ! Sequential characters like "123" are easy to guess.
Suggestions:
  • Avoid common passwords and dictionary words entirely.
  • Avoid predictable sequences, keyboard walks, and repeated characters.
  • Make it at least 12 characters long — length beats complexity.
```

## Use it as a library

```ts
import { analyze } from "typescript-password-analyzer";

const result = analyze(userInput);
if (result.score < 3) {
  console.log(result.warnings);   // why it's weak
  console.log(result.suggestions); // how to fix it
}
```

## Tests

```bash
npm install
npm test   # vitest — entropy, pattern detection, crack times, scoring
```

## Tech stack

TypeScript (strict), Node.js 18+, Vitest. Zero runtime dependencies.

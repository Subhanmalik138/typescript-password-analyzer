#!/usr/bin/env node
// CLI: password-analyzer [--json] [--stdin] <password>
import { readFileSync } from "node:fs";
import { analyze } from "./analyzer.js";

function usage(): never {
  console.error("Usage: password-analyzer [--json] [--stdin] <password>");
  console.error("  --json   machine-readable output");
  console.error("  --stdin  read the password from stdin (avoids shell history)");
  process.exit(2);
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const fromStdin = args.includes("--stdin");
const positional = args.filter((a) => !a.startsWith("--"));

let password: string;
if (fromStdin) {
  password = readFileSync(0, "utf8").replace(/[\r\n]+$/, "");
} else if (positional.length > 0) {
  password = positional[0]!;
} else {
  usage();
}

const result = analyze(password);

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const bar = "█".repeat(result.score + 1) + "░".repeat(4 - result.score);
  console.log(`Strength : ${bar} ${result.label} (${result.score}/4)`);
  console.log(
    `Entropy  : ${result.entropyBits} bits over ${result.length} chars (${result.charsets.join(", ") || "none"})`
  );
  console.log("Crack time estimates:");
  for (const c of result.crackTimes) {
    console.log(`  - ${c.scenario}: ${c.display}`);
  }
  if (result.warnings.length > 0) {
    console.log("Warnings:");
    for (const w of result.warnings) console.log(`  ! ${w}`);
  }
  if (result.suggestions.length > 0) {
    console.log("Suggestions:");
    for (const s of result.suggestions) console.log(`  • ${s}`);
  }
}

// Public API surface.
export { analyze } from "./analyzer.js";
export type { AnalysisResult } from "./analyzer.js";
export { charsetInfo, charsetEntropy, shannonEntropyPerChar } from "./entropy.js";
export type { CharsetInfo } from "./entropy.js";
export {
  detectPatterns,
  dictionaryMatch,
  findKeyboardWalks,
  findRepeats,
  findSequences,
  findDates,
  leetNormalize,
} from "./patterns.js";
export type { PatternFinding, PatternType, DictionaryMatch } from "./patterns.js";
export { estimateCrackTimes, formatDuration, SCENARIOS } from "./crackTime.js";
export type { CrackTimeEstimate } from "./crackTime.js";

// services, features, and other libraries
import { Array, pipe, String } from "effect";

// Normalizes line endings and escapes literal backslashes first
const NORMALIZE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\r\n?/g, "\n"],
  [/\\/g, "\\\\"],
];

const INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/!(?=\[)/g, "\\!"],
  [/([`*[\]<&])/g, "\\$1"],
];

// Block constructs binding within 0-3 leading spaces
const BLOCK_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^( {0,3})([#>])/gm, "$1\\$2"],
  [/^( {0,3})([-+])(?=\s|$)/gm, "$1\\$2"],
  [/^( {0,3})(\d+)([.)])(?=\s|$)/gm, "$1$2\\$3"],
  [/^( {0,3})([-_])(?=(?:\s*\2){2,}\s*$)/gm, "$1\\$2"],
  [/^( {0,3})([-=])(?=\2*\s*$)/gm, "$1\\$2"],
  [/^(?! {4})([ |:]*)(-)(?=[ \t|:-]*$)/gm, "$1\\$2"],
];

// Word boundary underscores and multi-character tilde runs
const EMPHASIS_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\$&"],
  [/~(?=~)|(?<=~)~/gu, "\\~"],
];

const BLANK_LINE_RULE: readonly [RegExp, string] = [/\n{3,}/g, "\n\n"];
const MD_ESCAPE_RULES = [...NORMALIZE_RULES, ...INLINE_RULES, ...EMPHASIS_RULES, ...BLOCK_RULES, BLANK_LINE_RULE];

// Escapes block-level markdown text
export const escapeMd = (text: string) =>
  pipe(
    Array.reduce(MD_ESCAPE_RULES, String.trimStart(text), (escaped, [pattern, replacement]) => escaped.replace(pattern, replacement)),
    String.trim
  );

// Escapes inline markdown text, collapsing newlines into spaces
export const escapeMdInline = (text: string) => escapeMd(text.replace(/[\r\n]+/g, " "));

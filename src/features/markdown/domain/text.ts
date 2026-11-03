// Markdown sanitization, inline escaping, and heading depth adjustments.

// services, features, and other libraries
import { Array, pipe, String } from "effect";

// types
import type { Translate } from "@/domain/models";

// Line normalization and backslash escaping must run first.
const NORMALIZE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\r\n?/g, "\n"],
  [/\\/g, "\\\\"],
];

// Inline markdown syntax escaping (images, code spans, emphasis, brackets, raw HTML).
const INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/!(?=\[)/g, "\\!"],
  [/([`*[\]<])/g, "\\$1"],
];

// Line-boundary block markers (headings, blockquotes, bullets, ordered lists, horizontal rules, table delimiters).
const BLOCK_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(\s*)([#>])/gm, "$1\\$2"],
  [/^(\s*)([-+])(?=\s|$)/gm, "$1\\$2"],
  [/^(\s*)(\d+)([.)])(?=\s|$)/gm, "$1$2\\$3"],
  [/^(\s{0,3})([-_])(?=(?:\s*\2){2,}\s*$)/gm, "$1\\$2"],
  [/^(\s{0,3})([-=])(?=\2*\s*$)/gm, "$1\\$2"],
  [/^([\s|:]*?)(-)/gm, "$1\\$2"],
];

// Word boundary rules and excess newline collapse.
const WORD_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\$&"],
  [/~~/g, "\\~\\~"],
  [/\n{3,}/g, "\n\n"],
];

const MD_ESCAPE_RULES: ReadonlyArray<readonly [RegExp, string]> = [...NORMALIZE_RULES, ...INLINE_RULES, ...BLOCK_RULES, ...WORD_RULES];
const DEMOTE_HEADINGS = /^(#{1,4})(?= )/gm;

// Sanitizes authored prose to prevent inadvertent Markdown formatting or HTML injection.
export const escapeMd = (text: string) =>
  pipe(
    MD_ESCAPE_RULES,
    Array.reduce(text, (value, [pattern, replacement]) => String.replace(pattern, replacement)(value)),
    String.trim
  );

// Escapes single-line values, collapsing newlines into spaces.
export const escapeMdInline = (text: string) => escapeMd(pipe(text, String.replace(/\n+/g, " ")));

// Demotes heading levels by two hashes for inclusion in full concatenated indexes.
export const demoteHeadings = (markdown: string) => markdown.replace(DEMOTE_HEADINGS, (hashes) => `${hashes}##`);

// Identity translation fallback returning source text unmodified.
export const translateSource: Translate = (source) => source;

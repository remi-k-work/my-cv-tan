// The escape engine: the one boundary authored or translated content crosses before it reaches a
// crawler-parseable document. Every rule only ever inserts a backslash, so escaping neutralizes
// markup without deleting a character the author wrote — the invariant escaping.test.ts pins
// across the whole table. Document assembly primitives live in ./format; the documents these
// primitives are assembled into live in ./twins and ./detail-twin.

// services, features, and other libraries
import { Array, pipe, String } from "effect";

// Line endings are collapsed and a literal backslash doubled before any escape rule runs, so
// every rule below reads the author's own text rather than an earlier rule's output. Normalizing
// endings is not an escape — it drops a `\r` instead of neutralizing a marker — but every rule
// after it only ever inserts a backslash, so escaping itself can never delete a character the
// author wrote: the invariant the regression guards pin for every rule below.
const NORMALIZE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\r\n?/g, "\n"],
  [/\\/g, "\\\\"],
];

const INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/!(?=\[)/g, "\\!"],
  [/([`*[\]<&])/g, "\\$1"],
];

// Headings, blockquotes and list markers bind at a line start indented by at most three spaces.
// Four spaces — or a tab — opens an indented code block instead, where a backslash is content
// rather than an escape: neutralising a marker there would print a stray "\" the author never
// wrote. The thematic-break and setext rules below already carry the same bound.
const BLOCK_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^( {0,3})([#>])/gm, "$1\\$2"],
  [/^( {0,3})([-+])(?=\s|$)/gm, "$1\\$2"],
  [/^( {0,3})(\d+)([.)])(?=\s|$)/gm, "$1$2\\$3"],
  [/^( {0,3})([-_])(?=(?:\s*\2){2,}\s*$)/gm, "$1\\$2"],
  [/^( {0,3})([-=])(?=\2*\s*$)/gm, "$1\\$2"],
  // A GFM delimiter row is a line of only dashes, colons, pipes and whitespace; escaping its
  // first dash makes that row's leading cell invalid, so no table can form. Requiring the rest
  // of the line to be delimiter characters too leaves prose that merely starts with "|" alone.
  // A row indented four spaces is an indented code block, where a backslash is content rather
  // than an escape.
  [/^(?! {4})([ |:]*)(-)(?=[ \t|:-]*$)/gm, "$1\\$2"],
];

// Emphasis markers bind at a word boundary rather than at a line start, so they are escaped per
// marker: an intraword underscore stays literal the way CommonMark reads it, a strikethrough run
// keeps every tilde the author wrote, and a tilde only counts as a marker inside a run of two or
// more — a lone tilde can neither strike through nor fence, so it stays prose punctuation.
const EMPHASIS_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\$&"],
  [/~(?=~)|(?<=~)~/gu, "\\~"],
];

// Authored prose is normalized to one blank line between blocks, after every escape pass has run.
const BLANK_LINE_RULE: readonly [RegExp, string] = [/\n{3,}/g, "\n\n"];

// The character-anchored rules run before the line-anchored ones so that every rule after them
// reads the author's text — backslashes doubled — instead of another rule's output. A block rule
// writing "\_" for a thematic-break run would otherwise read to the emphasis rule as an unescaped
// boundary, and grow a second backslash on a character that was already neutralized: an authored
// "___" published as "\___", a stray "\" no pass ever wrote.
const MD_ESCAPE_RULES = [...NORMALIZE_RULES, ...INLINE_RULES, ...EMPHASIS_RULES, ...BLOCK_RULES, BLANK_LINE_RULE];

// Every escapeMd result is published at a line start, because mdBody joins its blocks with a
// blank line. The input's leading whitespace is therefore meaningless — the final trim would
// strip it — so it is normalized off before the rules run rather than after them. Leaving it in
// place would let the trim erase the very indent the block rules read as an indented code block,
// un-neutralizing a heading, list marker or table the author never meant as one.
export const escapeMd = (text: string) =>
  pipe(
    Array.reduce(MD_ESCAPE_RULES, String.trimStart(text), (escaped, [pattern, replacement]) => escaped.replace(pattern, replacement)),
    String.trim
  );

export const escapeMdInline = (text: string) => escapeMd(text.replace(/[\r\n]+/g, " "));

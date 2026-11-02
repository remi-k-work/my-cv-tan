// services, features, and other libraries
import { Array, pipe, String } from "effect";

// types
import type { Translate } from "@/domain/models";

// --- Content safety and source-language fallbacks ---
// Split from blocks.ts because these are the two concerns every builder must trust: authored prose is
// data, so it is neutralized before it can fabricate structure, and the source-language fallback is
// one policy every English-only surface shares.
//
// The rule table is one flat list folded left, ordered by what the escaping actually depends on:
// normalization first (so every later rule observes one byte shape), then the inline constructors,
// then the block rules (which bind only at a line boundary), then the two markers whose meaning
// depends on the surrounding word and the blank-line collapse.
//
// Escaping is scoped to where a character actually binds markup, because every backslash that
// survives into a twin is noise an AI parser has to strip before it can quote the content: the rules
// below leave "ASP.NET and C#", "STOP Exclusion!" and "~30%" untouched while still neutralizing
// headings, lists, quotes, links, code, tables and HTML.
//
// Two invariants the table is ordered to hold, and that the regression tests pin down: no rule may
// destroy an authored character (every replacement expands or prefixes, never collapses), and no
// line shape may reach the document twice (each rule's output no longer matches the next rule).

// Line endings come first so the `m`-flagged block rules only ever see \n; backslashes come before
// every character escape because each rule below inserts a literal "\" of its own, so an authored
// backslash must already be escaped or a later pass would read it as its own escape.
const NORMALIZE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\r\n?/g, "\n"],
  [/\\/g, "\\\\"],
];

// The inline constructors that fabricate markup from the middle of a sentence. "<" stays always-on
// (raw HTML is the one injection an author string must never reach the document); "#" and ">" are
// line-scoped in BLOCK_RULES below.
//
// The image rule reads the raw author text, so it MUST run before the bracket rule: once that rule
// has written "\[" the lookahead `(?=\[)` no longer matches, and the "!" rule would never fire. The
// order is the only thing that makes this entry live code rather than dead weight in the table.
const INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  // "!" builds an image only directly in front of a "[", so a sentence-final "!" stays punctuation
  [/!(?=\[)/g, "\\!"],
  [/([`*[\]<])/g, "\\$1"],
];

// Block rules, which bind only at a line boundary, ordered most specific first: a heading or quote
// before a bare bullet, a thematic break before a setext underline, and the table row last
// because a bare dash run is already claimed by the time it runs.
const BLOCK_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  // ATX headings and blockquotes bind at the start of a line, so a mid-sentence "#" in
  // "ASP.NET and C#" is literal text rather than a marker
  [/^(\s*)([#>])/gm, "$1\\$2"],

  // Bullet markers bind at the start of a line and at the end of one: CommonMark lets a bare marker
  // open an empty list item, so a trailing "-" alone would fabricate a list bullet
  [/^(\s*)([-+])(?=\s|$)/gm, "$1\\$2"],

  // An ordered marker escapes at its trailing "." / ")" rather than at the digit: a digit is not
  // ASCII punctuation, so "\1." would print a literal backslash, while "1\." both blocks the list
  // and renders as the authored text. Over-matching is harmless for the same reason.
  [/^(\s*)(\d+)([.)])(?=\s|$)/gm, "$1$2\\$3"],

  // Thematic breaks: "*" is already escaped above, so only "-" and "_" reach this rule
  [/^(\s{0,3})([-_])(?=(?:\s*\2){2,}\s*$)/gm, "$1\\$2"],

  // Setext underlines ("===" / "--" runs under a paragraph) would become headings; escape the first character
  [/^(\s{0,3})([-=])(?=\2*\s*$)/gm, "$1\\$2"],

  // A GFM delimiter row ("--- | ---", ":--|--:", "| --- |") directly under a pipe-separated
  // header row opens a table. "|" is prose punctuation ("the ratio A | B mattered"), so the pipe
  // itself stays raw; the row is escaped instead. A leading backslash makes its first cell
  // invalid, so no table forms — and CommonMark renders "\-" back as the authored "-", so the
  // characters on screen are unchanged.
  //
  // Last in the table, because every rule above claims its own line shape first: a bare "---"
  // is already a thematic break by the time this sees it, and a line whose first non-class
  // character is not "-" (any prose line starting with a letter) never matches the anchor.
  [/^([\s|:]*?)(-)/gm, "$1\\$2"],
];

// The two markers whose meaning depends on the surrounding word, then the blank-line collapse that
// keeps a long data intro from opening a document with a wall of empty lines.
const WORD_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  // "_" opens or closes emphasis only at a word boundary (CommonMark treats intraword "_" as
  // literal), so "snake_case" survives untouched while "_emphasis_" is neutralized
  [/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\$&"],

  // Strikethrough is the only markup "~" opens and it needs a run of two, so a lone "~30%" stays
  // literal while "~~deprecated~~" is neutralized.
  //
  // Matched per pair rather than as a whole run: the run form this replaced, "(~~)+", consumed
  // every repetition but replaced all of them with one escaped pair, so a four-tilde run reached
  // the twin as two tildes — authored characters destroyed rather than neutralized.
  [/~~/g, "\\~\\~"],

  [/\n{3,}/g, "\n\n"],
];

const MD_ESCAPE_RULES: ReadonlyArray<readonly [RegExp, string]> = [...NORMALIZE_RULES, ...INLINE_RULES, ...BLOCK_RULES, ...WORD_RULES];

// Normalize authored prose while preventing it from creating headings, lists, quotes, links, code
// or raw HTML (the ordered rule table is folded left)
export const escapeMd = (text: string) =>
  pipe(
    MD_ESCAPE_RULES,
    Array.reduce(text, (value, [pattern, replacement]) => String.replace(pattern, replacement)(value)),
    String.trim
  );

// Single-line escaping for list items, link labels and link destinations. Newlines collapse to
// spaces *before* escaping, so the line-scoped rules never fire on a flattened value and a label
// carrying no newline costs one fewer pass over the table.
//
// No leading trim of its own: escaping a block-level value ends in `String.trim` anyway, so the
// surrounding padding is dropped by the pass that does the real work.
export const escapeMdInline = (text: string) => escapeMd(pipe(text, String.replace(/\n+/g, " ")));

// --- Heading depth inside a concatenated document ---

// A twin rendered inside llms-full.txt keeps every word of its body and only sits deeper: the
// companion spends `#` on the site and `##` on one document, so the twin's own `#` headline and
// `##` sections have to move down by exactly two levels to stay distinguishable depths rather than
// collapsing into the same flat run of `##` the document markers use.
//
// Two levels is the right number rather than one: at one, the twin's headline and its sections would
// land on the same depth as each other, so a parser could still not tell "this document's title"
// from "a section of the previous document". The source header above provides the attribution back
// to the canonical twin.
const DEMOTE_HEADINGS = /^(#{1,4})(?= )/gm;

// Safe on already-rendered Markdown because the builders own escaping: an authored heading
// character is `\#` by the time it reaches here and never matches, and frontmatter plus the `---`
// delimiter carry no `#` at all.
export const demoteHeadings = (markdown: string) => markdown.replace(DEMOTE_HEADINGS, (hashes) => `${hashes}##`);

// Source-language copy: the same fallback the dictionary itself applies per missing key.
// Shared by the service's translation-failure recovery and the English-only AI indexes.
export const translateSource: Translate = (source) => source;

// Security-sensitive Markdown serialization toolkit: the escape engine, YAML frontmatter
// writer, inline/block builders, and the shared link projections every twin and AI index
// document is assembled from. Twin declarations and page-specific builders live in ./twins.

// meta (shared)
import { Array, pipe } from "effect";
import { absoluteUrl, encodeParens } from "@/features/meta/domain/urls";

// types
import type { Translate } from "@/domain/models";

// --- Markdown formatting primitives ---

// Each pass only ever inserts a backslash, so escaping can never delete an authored character —
// the invariant the regression guards pin for every rule below.
const NORMALIZE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\r\n?/g, "\n"],
  [/\\/g, "\\\\"],
];

const INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/!(?=\[)/g, "\\!"],
  [/([`*[\]<])/g, "\\$1"],
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
// word: a strikethrough run keeps every tilde the author wrote, and an intraword underscore stays
// literal the way CommonMark reads it.
const EMPHASIS_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\$&"],
  [/~~/g, "\\~\\~"],
];

// Authored prose is normalized to one blank line between blocks, after every escape pass has run.
const BLANK_LINE_RULE: readonly [RegExp, string] = [/\n{3,}/g, "\n\n"];

const MD_ESCAPE_RULES = [...NORMALIZE_RULES, ...INLINE_RULES, ...BLOCK_RULES, ...EMPHASIS_RULES, BLANK_LINE_RULE];
const DEMOTE_HEADINGS = /^(#{1,4})(?= )/gm;

export const escapeMd = (text: string) =>
  Array.reduce(MD_ESCAPE_RULES, text, (escaped, [pattern, replacement]) => escaped.replace(pattern, replacement)).trim();

export const escapeMdInline = (text: string) => escapeMd(text.replace(/[\r\n]+/g, " "));
export const demoteHeadings = (markdown: string) => markdown.replace(DEMOTE_HEADINGS, (hashes) => `${hashes}##`);

const FRONTMATTER_DELIMITER = "---";
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

const yamlValue = (value: string) => JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);

const yamlFields = (fields: Readonly<Record<string, string>>) =>
  Object.entries(fields)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join("\n");

// The twin's identity block, delimited for a document that is the twin itself.
export const frontmatter = (fields: Readonly<Record<string, string>>) => [FRONTMATTER_DELIMITER, yamlFields(fields), FRONTMATTER_DELIMITER].join("\n");

// --- Twin documents ---

// A twin in two parts: the identity facts every surface restates, and the body. They stay apart
// because the two publishings of a twin need them apart — the served twin carries the facts as
// YAML frontmatter above the body, while the concatenated companion republishes them fenced,
// because a raw `---` block inside a document is not frontmatter: it parses as a thematic break,
// and its closing line, sitting directly under the last fact, turns that fact into a setext
// heading at the same depth as the companion's own section headings.
export interface MarkdownTwin {
  readonly facts: Readonly<Record<string, string>>;
  readonly body: string;
}

// The twin as served: its facts as frontmatter, then its body.
export const twinDocument = ({ facts, body }: MarkdownTwin) => mdDocument([frontmatter(facts), body]);

// An embedded block must fence with more backticks than the longest run it contains, or an authored
// value carrying that run closes the fence and the remaining facts publish as document prose.
const fenceFor = (content: string) =>
  pipe(
    Array.fromIterable(content.matchAll(/`+/g)),
    Array.map((match) => match[0].length),
    Array.reduce(0, Math.max),
    (longest) => "`".repeat(Math.max(3, longest + 1))
  );

// The twin's facts, fenced for embedding inside another document.
export const fencedFacts = (facts: Readonly<Record<string, string>>) => {
  const fields = yamlFields(facts);
  const fence = fenceFor(fields);

  return `${fence}yaml\n${fields}\n${fence}`;
};

export const mdHeading = (level: 1 | 2 | 3, text: string) => `${"#".repeat(level)} ${escapeMdInline(text)}`;
export const mdQuote = (text: string) => `> ${escapeMdInline(text)}`;
export const mdBulletList = (items: ReadonlyArray<string>) => items.map((item) => `- ${item}`).join("\n");
export const mdFact = (label: string, value: string) => `${escapeMdInline(label)}: ${escapeMdInline(value)}`;
export const mdBody = (blocks: ReadonlyArray<string>) => blocks.filter(Boolean).join("\n\n");
export const mdTitledSection = (title: string, body: string) => mdBody([mdHeading(2, title), body]);
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;
export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate("No entries."))}_`;

export const mdLink = (label: string, href: string) => `[${escapeMdInline(label)}](${encodeParens(href)})`;

export const translatedLink = (label: string, href: string, translate: Translate) => mdLink(translate(label), href);

export const mdIndexEntry = (label: string, canonical: string, twinUrl: string, summary?: string) => {
  const beforeTwin = summary === undefined ? "" : `${escapeMdInline(summary)} `;
  // The twin URL is an embedded destination exactly like mdLink's href, so it takes the same
  // paren encoding: a raw ")" would otherwise close the destination and truncate the entry.
  return `${mdLink(label, canonical)}: ${beforeTwin}Markdown: ${encodeParens(twinUrl)}`;
};

// --- Shared link projections ---

export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(documents.map(({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) =>
  profiles.map(({ name, href }) => mdFact(name, href));

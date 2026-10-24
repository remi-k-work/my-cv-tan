// services, features, and other libraries
import { Array, Option, pipe, Record, Schema, String } from "effect";
import { msg } from "gt-tanstack-start";
import { encodeParens } from "@/features/meta/domain/url";

// types
import type { Translate } from "@/domain/models";

// constants
import { FRONTMATTER_DELIMITER } from "./constants";

// Normalize authored prose while preventing it from creating headings, lists, quotes, tables, or raw HTML
export const escapeMd = (text: string) =>
  pipe(
    text,
    String.replace(/\r\n?/g, "\n"),
    // Escape backslashes first so later escapes stay literal
    String.replace(/\\/g, "\\\\"),
    String.replace(/([#*_`<>[\]!~|])/g, "\\$1"),
    // Block markers are meaningful only at the start of a line
    String.replace(/^(\s*)([-+]|\d+[.)])(?=\s)/gm, "$1\\$2"),
    String.replace(/^(\s{0,3})([-*_])(?=(?:\s*\2){2,}\s*$)/gm, "$1\\$2"),
    // Setext underlines ("===" / "--" runs under a paragraph) would become headings; escape the first character
    String.replace(/^(\s{0,3})([-=])(?=\2*\s*$)/gm, "$1\\$2"),
    // Collapse 3+ blank lines (data intros are long prose)
    String.replace(/\n{3,}/g, "\n\n"),
    String.trim
  );

// Single-line escaping for list items, link labels and table-ish content
export const escapeMdInline = (text: string) => pipe(escapeMd(text), String.replace(/\n+/g, " "), String.trim);

// JSON string quoting is also valid for YAML double-quoted scalars and handles control characters
const yamlValue = (value: string) => JSON.stringify(value);

// Content bundles may contain stale or malformed URLs; only publish links with web protocols
export const mdExternalLink = (label: string, href: string) =>
  pipe(
    Schema.decodeOption(Schema.URLFromString)(href),
    Option.filter((url) => url.protocol === "http:" || url.protocol === "https:"),
    Option.map((url) => {
      // Bare Markdown destinations use percent-encoded parentheses to stay unambiguous
      const destination = encodeParens(url.href);
      return `[${escapeMdInline(label)}](${destination})`;
    })
  );

// Frontmatter mirrors <head> meta for AI indexers (title, description, canonical, language)
export const frontmatter = (fields: Record.ReadonlyRecord<string, string>) =>
  pipe(
    fields,
    Record.toEntries,
    Array.map(([key, value]) => `${key}: ${yamlValue(value)}`),
    Array.join("\n"),
    (body) => Array.join([FRONTMATTER_DELIMITER, body, FRONTMATTER_DELIMITER], "\n")
  );

export const mdHeading = (level: 1 | 2 | 3, text: string) => `${"#".repeat(level)} ${escapeMdInline(text)}`;

export const mdQuote = (text: string) => `> ${escapeMdInline(text)}`;

export const mdBulletList = (items: ReadonlyArray<string>) =>
  pipe(
    items,
    Array.map((item) => `- ${item}`),
    Array.join("\n")
  );

// Block-level elements are separated by exactly one blank line; keeping that rule here means
// builders never interleave empty strings by hand
export const mdBody = (blocks: ReadonlyArray<string>) => pipe(blocks, Array.filter(String.isNonEmpty), Array.join("\n\n"));

// A titled block: heading, blank line, then its body
export const mdSection = (heading: string, body: string) => mdBody([heading, body]);

// A complete document: normalized blocks plus one trailing newline, so files and the
// concatenated llms-full.txt always end cleanly at a line boundary
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;

// Explicit "no entries" marker: a bare section heading would read as truncated content to AI parsers
export const mdEmptyMarker = (translate: Translate) => `_${translate(msg("No entries."))}_`;

// Source-language copy: the same fallback the dictionary itself applies per missing key.
// Shared by the service's translation-failure recovery and the English-only AI indexes.
export const translateSource: Translate = (source) => source;

// services, features, and other libraries
import { Array, Option, pipe, Record, Schema, String } from "effect";
import { msg } from "gt-tanstack-start";

// types
import type { Translate } from "@/domain";

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
    // Collapse 3+ blank lines (data intros are long prose)
    String.replace(/\n{3,}/g, "\n\n"),
    String.trim
  );

// Single-line escaping for list items, link labels and table-ish content
export const escapeMdInline = (text: string) => pipe(escapeMd(text), String.replace(/\n+/g, " "), String.trim);

// JSON string quoting is also valid for YAML double-quoted scalars and handles control characters
export const yamlValue = (value: string) => JSON.stringify(value);

// Content bundles may contain stale or malformed URLs; only publish links with web protocols
export const mdExternalLink = (label: string, href: string) =>
  pipe(
    Schema.decodeOption(Schema.URLFromString)(href),
    Option.filter((url) => url.protocol === "http:" || url.protocol === "https:"),
    Option.map((url) => `[${escapeMdInline(label)}](<${url.href}>)`)
  );

// Frontmatter mirrors <head> meta for AI indexers (title, description, canonical, language)
export const frontmatter = (fields: Record.ReadonlyRecord<string, string>) =>
  pipe(
    fields,
    Record.toEntries,
    Array.map(([key, value]) => `${key}: ${yamlValue(value)}`),
    Array.join("\n"),
    (body) => [FRONTMATTER_DELIMITER, body, FRONTMATTER_DELIMITER, ""].join("\n")
  );

export const mdHeading = (level: 1 | 2 | 3, text: string) => `${"#".repeat(level)} ${escapeMdInline(text)}`;

export const mdQuote = (text: string) => `> ${escapeMdInline(text)}`;

export const mdBulletList = (items: ReadonlyArray<string>) =>
  pipe(
    items,
    Array.map((item) => `- ${item}`),
    Array.join("\n")
  );

// Explicit "no entries" marker: a bare section heading would read as truncated content to AI parsers
export const mdEmptyMarker = (translate: Translate) => `_${translate(msg("No entries."))}_`;

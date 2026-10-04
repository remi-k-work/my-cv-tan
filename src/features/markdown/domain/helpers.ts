// services, features, and other libraries
import { Array, pipe, Record, String } from "effect";

// constants
import { FRONTMATTER_DELIMITER } from "./constants";

// Normalizes prose from the JSON content bundles into safe Markdown body text:
// no layout chrome, no raw HTML, heading-safe, blank-line collapsed
export const escapeMd = (text: string) =>
  pipe(
    text,
    String.replace(/\r\n/g, "\n"),
    // Escape backslashes first so later escapes stay literal
    String.replace(/\\/g, "\\\\"),
    // Neutralize Markdown control characters that could re-shape the document
    // (brackets escaped in a second pass: `[` needs no escape inside a character class)
    String.replace(/([#*_`<>])/g, "\\$1"),
    String.replace(/(\[|\])/g, "\\$1"),
    // Collapse 3+ blank lines (data intros are long prose)
    String.replace(/\n{3,}/g, "\n\n"),
    String.trim
  );

// Single-line escaping for list items, link labels and table-ish content
export const escapeMdInline = (text: string) => pipe(escapeMd(text), String.replace(/\n+/g, " "), String.trim);

// YAML-safe double-quoted scalar for frontmatter values
export const yamlValue = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;

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

export const mdBulletList = (items: ReadonlyArray<string>) => pipe(items, Array.map((item) => `- ${item}`), Array.join("\n"));

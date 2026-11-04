// Markdown escaping, formatting primitives, and document cross-links.

// services, features, and other libraries
import { Option, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { absoluteUrl, decodeUrlOption, encodeParens } from "@/features/meta/domain/helpers";

// types
import type { Translate } from "@/domain/models";
import type { LocalizedMdInput } from "./models";

// constants
import { BRANDED_TITLE, DEFAULT_LANGUAGE, SITE_NAME } from "@/features/meta/domain/constants";

// --- CommonMark & GFM Escaping Rules ---

const NORMALIZE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\r\n?/g, "\n"],
  [/\\/g, "\\\\"],
];

const INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/!(?=\[)/g, "\\!"],
  [/([`*[\]<])/g, "\\$1"],
];

const BLOCK_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(\s*)([#>])/gm, "$1\\$2"],
  [/^(\s*)([-+])(?=\s|$)/gm, "$1\\$2"],
  [/^(\s*)(\d+)([.)])(?=\s|$)/gm, "$1$2\\$3"],
  [/^(\s{0,3})([-_])(?=(?:\s*\2){2,}\s*$)/gm, "$1\\$2"],
  [/^(\s{0,3})([-=])(?=\2*\s*$)/gm, "$1\\$2"],
  [/^([\s|:]*?)(-)/gm, "$1\\$2"],
];

const WORD_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, "\\$&"],
  [/~~/g, "\\~\\~"],
  [/\n{3,}/g, "\n\n"],
];

const MD_ESCAPE_RULES = [...NORMALIZE_RULES, ...INLINE_RULES, ...BLOCK_RULES, ...WORD_RULES];
const DEMOTE_HEADINGS = /^(#{1,4})(?= )/gm;

export const escapeMd = (text: string) => {
  let result = text;
  for (const [pattern, replacement] of MD_ESCAPE_RULES) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
};

export const escapeMdInline = (text: string) => escapeMd(text.replace(/\n+/g, " "));
export const demoteHeadings = (markdown: string) => markdown.replace(DEMOTE_HEADINGS, (hashes) => `${hashes}##`);

export const translateSource: Translate = (source) => source;
export const SOURCE_COPY: LocalizedMdInput = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource };

// --- Frontmatter & Document Primitives ---

const FRONTMATTER_DELIMITER = "---";
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

const yamlValue = (value: string) =>
  JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);

export const frontmatter = (fields: Readonly<Record<string, string>>) => {
  const body = Object.entries(fields)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join("\n");
  return [FRONTMATTER_DELIMITER, body, FRONTMATTER_DELIMITER].join("\n");
};

export const twinIdentity = (input: {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly preferredLanguage: string;
}) => ({
  title: BRANDED_TITLE(input.title),
  description: input.description,
  author: SITE_NAME,
  canonical: input.canonical,
  lang: input.preferredLanguage,
});

export const mdHeading = (level: 1 | 2 | 3, text: string) => `${"#".repeat(level)} ${escapeMdInline(text)}`;
export const mdQuote = (text: string) => `> ${escapeMdInline(text)}`;
export const mdBulletList = (items: ReadonlyArray<string>) => items.map((item) => `- ${item}`).join("\n");
export const mdFact = (label: string, value: string) => `${escapeMdInline(label)}: ${escapeMdInline(value)}`;
export const mdBody = (blocks: ReadonlyArray<string>) => blocks.filter(Boolean).join("\n\n");
export const mdTitledSection = (title: string, body: string) => mdBody([mdHeading(2, title), body]);
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;
export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate(msg("No entries.")))}_`;

export const mdLink = (label: string, href: string) => `[${escapeMdInline(label)}](${href})`;

export const mdExternalLink = (label: string, href: string) =>
  pipe(
    decodeUrlOption(href),
    Option.filter((url) => url.protocol === "http:" || url.protocol === "https:"),
    Option.map((url) => mdLink(label, encodeParens(url.href)))
  );

export const translatedLink = (label: string, href: string, translate: Translate) => mdLink(translate(msg(label)), href);

export const mdIndexEntry = (label: string, canonical: string, twinUrl: string, summary?: string) => {
  const beforeTwin = summary === undefined ? "" : `${escapeMdInline(summary)} `;
  return `${mdLink(label, canonical)}: ${beforeTwin}Markdown: ${twinUrl}`;
};

export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(documents.map(({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) =>
  profiles.map(({ name, href }) => mdFact(name, href));

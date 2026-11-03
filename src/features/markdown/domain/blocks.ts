// Markdown block composition and formatting primitives.
import { msg } from "gt-tanstack-start";
import { Array, Option, pipe, Record, String } from "effect";
import { absoluteUrl, decodeUrlOption, encodeParens } from "@/features/meta/domain/url";
import { escapeMd, escapeMdInline } from "./text";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";

// constants
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/constants";
import { FRONTMATTER_DELIMITER } from "./constants";

// Escapes control characters rejected by YAML 1.2 double-quoted scalars.
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

const yamlValue = (value: string) =>
  JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);

export const mdLink = (label: string, href: string) => `[${escapeMdInline(label)}](${href})`;

// Formats external web links, omitting non-http/https protocols.
export const mdExternalLink = (label: string, href: string) =>
  pipe(
    decodeUrlOption(href),
    Option.filter((url) => url.protocol === "http:" || url.protocol === "https:"),
    Option.map((url) => mdLink(label, encodeParens(url.href)))
  );

// Emits a YAML frontmatter block.
export const frontmatter = (fields: Record.ReadonlyRecord<string, string>) =>
  pipe(
    fields,
    Record.toEntries,
    Array.map(([key, value]) => `${key}: ${yamlValue(value)}`),
    Array.join("\n"),
    (body) => [FRONTMATTER_DELIMITER, body, FRONTMATTER_DELIMITER].join("\n")
  );

// Shared identity frontmatter fields mirroring HTML <head> metadata.
export const twinIdentity = (input: {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly preferredLanguage: PreferredLanguage;
}) => ({
  title: BRANDED_TITLE(input.title),
  description: input.description,
  author: SITE_NAME,
  canonical: input.canonical,
  lang: input.preferredLanguage,
});

export const mdHeading = (level: 1 | 2 | 3, text: string) => `${"#".repeat(level)} ${escapeMdInline(text)}`;

export const mdQuote = (text: string) => `> ${escapeMdInline(text)}`;

export const mdBulletList = (items: ReadonlyArray<string>) => pipe(items, Array.map((item) => `- ${item}`), Array.join("\n"));

export const mdFact = (label: string, value: string) => `${escapeMdInline(label)}: ${escapeMdInline(value)}`;

export const mdBody = (blocks: ReadonlyArray<string>) => pipe(blocks, Array.filter(String.isNonEmpty), Array.join("\n\n"));

export const mdTitledSection = (title: string, body: string) => mdBody([mdHeading(2, title), body]);

export const translatedLink = (label: string, href: string, translate: Translate) => mdLink(translate(msg(label)), href);

export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;

export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate(msg("No entries.")))}_`;

// Formats a machine-readable entry line with canonical URL and twin URL.
export const mdIndexEntry = (label: string, canonical: string, twinUrl: string, summary?: string) => {
  const beforeTwin = summary === undefined ? "" : `${summary} `;

  return `${mdLink(label, canonical)}: ${beforeTwin}Markdown: ${twinUrl}`;
};

export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(Array.map(documents, ({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) =>
  Array.map(profiles, ({ name, href }) => mdFact(name, href));

// 503 fallback body for Markdown twins.
export const unavailableMarkdownBody = (translate: Translate) =>
  mdDocument([
    mdHeading(1, translate(msg("Content temporarily unavailable"))),
    escapeMd(translate(msg("The required portfolio content could not be loaded. Please try again shortly."))),
  ]);

// Plain-text 503 fallback body for AI index files.
export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n`;

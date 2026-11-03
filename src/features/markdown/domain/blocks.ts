// Markdown block composition, formatting primitives, and document graph cross-links.

// services, features, and other libraries
import { Option, pipe } from "effect";
import { msg } from "gt-tanstack-start";
import { absoluteUrl, decodeUrlOption, encodeParens, markdownTwinUrl } from "@/features/meta/domain/url";
import { escapeMd, escapeMdInline } from "./text";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/static-pages";

interface TwinIdentityInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly preferredLanguage: PreferredLanguage;
}

// constants
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/constants";
import { AI_INDEXES, LLMS_TXT_INDEX } from "@/features/meta/domain/links";
import { FRONTMATTER_DELIMITER } from "./constants";
import { HOME_PATH, STATIC_PAGES, STATIC_PATHS } from "@/features/meta/domain/static-pages";

const HOME_LABEL = STATIC_PAGES[HOME_PATH].label;

// Escapes control characters rejected by YAML 1.2 double-quoted scalars.
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

const yamlValue = (value: string) =>
  JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);

export const mdLink = (label: string, href: string) => `[${escapeMdInline(label)}](${href})`;
export const AI_INDEX_MARKDOWN_LINKS: ReadonlyArray<string> = AI_INDEXES.map(({ name, url }) => mdLink(name, url));

// Formats external web links, omitting non-http/https protocols.
export const mdExternalLink = (label: string, href: string) =>
  pipe(
    decodeUrlOption(href),
    Option.filter((url) => url.protocol === "http:" || url.protocol === "https:"),
    Option.map((url) => mdLink(label, encodeParens(url.href)))
  );

// Emits a YAML frontmatter block.
export const frontmatter = (fields: Readonly<Record<string, string>>) => {
  const body = Object.entries(fields)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join("\n");
  return [FRONTMATTER_DELIMITER, body, FRONTMATTER_DELIMITER].join("\n");
};

// Shared identity frontmatter fields mirroring HTML <head> metadata.
export const twinIdentity = (input: TwinIdentityInput) => ({
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

const translatedLink = (label: string, href: string, translate: Translate) => mdLink(translate(msg(label)), href);
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;
export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate(msg("No entries.")))}_`;

// Formats a machine-readable entry line with canonical URL and twin URL.
export const mdIndexEntry = (label: string, canonical: string, twinUrl: string, summary?: string) => {
  const beforeTwin = summary === undefined ? "" : `${summary} `;

  return `${mdLink(label, canonical)}: ${beforeTwin}Markdown: ${twinUrl}`;
};

export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(documents.map(({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) =>
  profiles.map(({ name, href }) => mdFact(name, href));

// 503 fallback body for Markdown twins.
export const unavailableMarkdownBody = (translate: Translate) =>
  mdDocument([
    mdHeading(1, translate(msg("Content temporarily unavailable"))),
    escapeMd(translate(msg("The required portfolio content could not be loaded. Please try again shortly."))),
  ]);

// Plain-text 503 fallback body for AI index files.
export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n`;

// --- Twin Document Graph Cross-Links ---

// Language-pinned link to the home page twin.
const homeLink = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  translatedLink(HOME_LABEL, markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, preferredLanguage), translate);

// Sibling twin links excluding the current page, plus AI indexes.
export const twinIndexLinks = (copy: StaticPageCopy, translate: Translate) =>
  mdBulletList([
    ...STATIC_PATHS.filter((path) => path !== copy.path).map((path) =>
      translatedLink(STATIC_PAGES[path].label, markdownTwinUrl(STATIC_PAGES[path].mdHref, copy.preferredLanguage), translate)
    ),
    ...AI_INDEX_MARKDOWN_LINKS,
  ]);

// Detail twin navigation links pointing back to home and AI discovery indexes.
export const detailIndexLinks = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([homeLink(preferredLanguage, translate), ...AI_INDEX_MARKDOWN_LINKS]);

// Escape hatch line for 404 responses directing crawlers to valid index documents.
export const deadEndEscapeLine = (preferredLanguage: PreferredLanguage, translate: Translate) => {
  const indexLink = mdLink(LLMS_TXT_INDEX.name, LLMS_TXT_INDEX.url);

  return `${escapeMdInline(translate(msg("See")))} ${homeLink(preferredLanguage, translate)} ${escapeMdInline(translate(msg("or")))} ${indexLink}.`;
};

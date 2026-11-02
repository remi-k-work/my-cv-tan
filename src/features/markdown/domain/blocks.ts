// services, features, and other libraries
import { msg } from "gt-tanstack-start";
import { Array, Option, pipe, Record, String } from "effect";
import { absoluteUrl, decodeUrlOption, encodeParens, markdownTwinUrl } from "@/features/meta/domain/url";
import { escapeMd, escapeMdInline } from "./text";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";

// constants
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/constants";
import { FRONTMATTER_DELIMITER } from "./constants";

// --- Markdown block composition ---
// Every builder returns a plain Markdown string; escaping the content it embeds is delegated to
// text.ts. Twins are shallow documents on purpose: one H1 per document and flat H2 sections keep
// the hierarchy readable to an AI parser that has no visual context.

// JSON string quoting is also valid for YAML double-quoted scalars, with one gap: JSON.stringify
// leaves DEL, the C1 controls and the two Unicode line separators unescaped, and none of those is
// accepted inside a YAML 1.2 double-quoted scalar. Escaping them here keeps a content value from
// producing frontmatter a parser rejects outright — critical because a YAML parse failure makes the
// entire twin unreadable to AI indexers.
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

const yamlValue = (value: string) =>
  JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);

// Content bundles may contain stale or malformed URLs, so only links with web protocols are published
export const mdExternalLink = (label: string, href: string) =>
  pipe(
    decodeUrlOption(href),
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
    (body) => [FRONTMATTER_DELIMITER, body, FRONTMATTER_DELIMITER].join("\n")
  );

// The identity every twin declares, mirroring the HTML <head> meta so an AI indexer reads the same
// title, description, author, canonical and language from either document. Spread by both page and
// detail twins, so the GEO contract is stated once instead of re-typed per builder
export const twinIdentity = (input: {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly preferredLanguage: PreferredLanguage;
}) => ({
  title: BRANDED_TITLE(input.title),
  description: input.description,
  // author mirrors the HTML author meta: authoritative attribution is a GEO signal
  author: SITE_NAME,
  canonical: input.canonical,
  lang: input.preferredLanguage,
});

// Level 3 exists for content *entries* — a school, or one document inside the concatenated
// full-content index — so an entry never sits at the same level as the document's own sections.
export const mdHeading = (level: 1 | 2 | 3, text: string) => `${"#".repeat(level)} ${escapeMdInline(text)}`;

export const mdQuote = (text: string) => `> ${escapeMdInline(text)}`;

export const mdBulletList = (items: ReadonlyArray<string>) => pipe(items, Array.map((item) => `- ${item}`), Array.join("\n"));

// One `Label: value` list line with both halves escaped. A translated label and a content value
// occupy an inline position, so neither may fabricate markup from a bullet prefix — the same rule
// mdEmptyMarker applies to translated prose.
export const mdFact = (label: string, value: string) => `${escapeMdInline(label)}: ${escapeMdInline(value)}`;

// Block-level elements are separated by exactly one blank line; keeping that rule here means
// builders never interleave empty strings by hand
export const mdBody = (blocks: ReadonlyArray<string>) => pipe(blocks, Array.filter(String.isNonEmpty), Array.join("\n\n"));

// The section idiom every twin repeats: one H2 heading, blank line, then its body
export const mdTitledSection = (title: string, body: string) => mdBody([mdHeading(2, title), body]);

// Internal twin reference pinned to the reader's own language: a Polish twin links Polish siblings
// instead of dropping every internal hop back onto the negotiated English default. Resolved through
// the one twin-URL helper, so a sibling link and the head advertisement of the same twin byte-match.
export const twinLink = (mdPath: string, preferredLanguage: PreferredLanguage) => markdownTwinUrl(mdPath, preferredLanguage);

// A translated label inside a link label — the ONE place that rule is written.
//
// A dictionary value carrying "]" would close the label early and fabricate a destination of its
// own, so every surface that prints a link whose text is dictionary copy routes through here rather
// than re-deriving the escape: the twins' sibling links, their downloadable documents, and the
// full-content table of contents all publish the same bytes or fail the same way.
export const translatedLink = (label: string, href: string, translate: Translate) => `[${escapeMdInline(translate(msg(label)))}](${href})`;

// A complete document: normalized blocks plus one trailing newline, so files and the concatenated
// llms-full.txt always end cleanly at a line boundary
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;

// Explicit "no entries" marker: a bare section heading would read as truncated content to AI parsers.
// The translated copy is authored data like any other, so it is escaped.
export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate(msg("No entries.")))}_`;

// --- Shared content tables ---
// The same list of documents, linked identically on every surface that publishes it: the twins render
// it translated, llms.txt renders it verbatim in English.

// Downloadable documents as markdown links with the absolute destination. Delegates to
// translatedLink so the escaping rule for "a dictionary label inside a link label" exists once
// instead of once per surface that publishes such a list.
//
// The English-only indexes pass `translateSource` rather than an identity lambda: the source copy is
// the same fallback every other English-only surface names explicitly.
export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(Array.map(documents, ({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

// Labeled profiles as `Name: URL` bullets, read from the one declaration the JSON-LD sameAs edges and
// the root rel="me" links already use, so no two surfaces pair a URL with a different name.
export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) => Array.map(profiles, ({ name, href }) => mdFact(name, href));

// --- Unavailable document bodies ---
// A 503 twin must still be parseable Markdown: it declares the same identity fields a found twin
// does, minus canonical and type, and names the document that failed. Escape keeps authored copy
// from fabricating structure in the one document an indexer reads while the site is degraded.
export const unavailableMarkdownBody = (translate: (source: string) => string) =>
  mdDocument([
    mdHeading(1, translate("Content temporarily unavailable")),
    escapeMd(translate("The required portfolio content could not be loaded. Please try again shortly.")),
  ]);

// A plain-text 503 for an AI index, naming the document that failed so a fetcher knows which
// retrieval surface is down rather than guessing. Lives here (not in meta/response) because only
// Markdown pipelines render unavailable bodies, and meta must not depend on markdown.
export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n`;

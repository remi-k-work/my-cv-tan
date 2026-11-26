// services, features, and other libraries
import { Array, Number, Option, Predicate, Record, String, flow, pipe } from "effect";
import { msg } from "gt-i18n";
import { absoluteUrl, encodeDestination, httpUrlOption } from "@/features/meta/domain/urls";
import { escapeMdInline } from "./escape";

// types
import type { Translate } from "@/domain/models";
import type { MarkdownTwin } from "./models";

// constants
const FRONTMATTER_DELIMITER = "---";
const DEMOTE_HEADINGS = /^(#+)(?= )/gm;

// Escapes DEL, C1 controls, and Unicode line separators for YAML double-quoted scalars
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

const isBlank = flow(String.trim, String.isEmpty);
const nonBlank = Predicate.not(isBlank);

// JSON quoting leaves these characters literal, so escape them for YAML double-quoted scalars
const yamlValue = (value: string) =>
  JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (char) => `\\u${pipe(char.charCodeAt(0).toString(16), String.padStart(4, "0"))}`);

const yamlFields = (fields: Readonly<Record<string, string>>) =>
  pipe(
    Record.toEntries(fields),
    Array.map(([key, value]) => `${key}: ${yamlValue(value)}`),
    Array.join("\n")
  );

export const frontmatter = (fields: Readonly<Record<string, string>>) => Array.join([FRONTMATTER_DELIMITER, yamlFields(fields), FRONTMATTER_DELIMITER], "\n");
export const twinDocument = ({ facts, body }: MarkdownTwin) => mdDocument([frontmatter(facts), body]);

// Demotes heading levels by 2 (e.g. H1 -> H3) for embedding inside concatenated companion documents
export const demoteHeadings = (markdown: string) =>
  // Markdown has no H7/H8: deep source headings clamp to H6 instead of publishing invalid structure
  markdown.replace(DEMOTE_HEADINGS, (hashes) => pipe("#", String.repeat(Number.min(6, hashes.length + 2))));

// Determines the minimum backtick fence length to avoid collisions with contained code
const fenceFor = (content: string) => {
  // A document with no backtick run at all fences at the minimum length
  const longest = pipe(
    content,
    String.match(/`+/g),
    Option.map(flow(Array.map(String.length), Array.reduce(0, Number.max))),
    Option.getOrElse(() => 0)
  );
  return pipe("`", String.repeat(Number.max(3, longest + 1)));
};

export const fencedFacts = (facts: Readonly<Record<string, string>>) => {
  const fields = yamlFields(facts);
  const fence = fenceFor(fields);
  return `${fence}yaml\n${fields}\n${fence}`;
};

// Shared inline prefix formatter: drops blank values so headings and blockquotes never emit stray markers
const prefixedInline = (prefix: string, text: string) =>
  pipe(
    text,
    Option.liftPredicate(nonBlank),
    Option.map((value) => `${prefix} ${escapeMdInline(value)}`),
    Option.getOrElse(() => "")
  );

export const mdHeading = (level: 1 | 2 | 3, text: string) => prefixedInline(pipe("#", String.repeat(level)), text);
export const mdQuote = (text: string) => prefixedInline(">", text);

export const mdBulletList = (items: ReadonlyArray<string>) =>
  pipe(
    items,
    Array.map((item) => `- ${item}`),
    Array.join("\n")
  );
export const mdFact = (label: string, value: string) => `${escapeMdInline(label)}: ${escapeMdInline(value)}`;
export const mdBody = (blocks: ReadonlyArray<string>) => pipe(blocks, Array.filter(nonBlank), Array.join("\n\n"));
export const mdTitledSection = (title: string, body: string) => mdBody([mdHeading(2, title), body]);
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;
export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate(msg("No entries.")))}_`;

export const mdLink = (label: string, href: string) =>
  pipe(
    // Encode before parsing so whitespace cannot be silently removed or terminate the destination
    encodeDestination(href),
    httpUrlOption,
    Option.match({
      // Unsafe or relative destinations remain readable text instead of becoming active links
      onNone: () => escapeMdInline(label),
      onSome: (url) => `[${escapeMdInline(label)}](${url})`,
    })
  );
export const translatedLink = (label: string, href: string, translate: Translate) => mdLink(translate(label), href);

export const mdIndexEntry = (label: string, canonical: string, markdownUrl: string, summary?: string) => {
  const summaryPrefix = pipe(
    Option.fromUndefinedOr(summary),
    Option.filter(nonBlank),
    Option.map((value) => `${escapeMdInline(value)} `),
    Option.getOrElse(() => "")
  );

  // llms.txt retrieval links lead to Markdown; the canonical HTML URL remains the citation source
  return `${mdLink(label, markdownUrl)}: ${summaryPrefix}${mdLink("HTML", canonical)}`;
};

export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(Array.map(documents, ({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

// Explicit links keep profile citations actionable without relying on optional bare-URL autolinking
export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) =>
  Array.map(profiles, ({ name, href }) => mdLink(name, href));

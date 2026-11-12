// services, features, and other libraries
import { Array, Number, Option, String, flow, pipe, Record } from "effect";
import { absoluteUrl, encodeDestination } from "@/features/meta/domain/urls";
import { escapeMdInline } from "./escape";

// types
import type { Translate } from "@/domain/models";
import type { MarkdownTwin } from "./models";

// constants
const FRONTMATTER_DELIMITER = "---";
const DEMOTE_HEADINGS = /^(#{1,4})(?= )/gm;

const isBlank = flow(String.trim, String.isEmpty);

// Escapes DEL, C1 controls, and Unicode line separators for YAML double-quoted scalars
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

const yamlValue = (value: string) => JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);

const yamlFields = (fields: Readonly<Record<string, string>>) =>
  pipe(
    Record.toEntries(fields),
    Array.map(([key, value]) => `${key}: ${yamlValue(value)}`),
    Array.join("\n")
  );

export const frontmatter = (fields: Readonly<Record<string, string>>) => Array.join([FRONTMATTER_DELIMITER, yamlFields(fields), FRONTMATTER_DELIMITER], "\n");
export const twinDocument = ({ facts, body }: MarkdownTwin) => mdDocument([frontmatter(facts), body]);

// Demotes heading levels by 2 (e.g. H1 -> H3) for embedding inside concatenated companion documents
export const demoteHeadings = (markdown: string) => markdown.replace(DEMOTE_HEADINGS, (hashes) => `${hashes}##`);

// Determines the minimum backtick fence length to avoid collisions with contained code
const fenceFor = (content: string) => {
  const runs = content.match(/`+/g) ?? [];
  const longest = Array.reduce(runs, 0, (max, run) => Number.max(max, run.length));
  return "`".repeat(Number.max(3, longest + 1));
};

export const fencedFacts = (facts: Readonly<Record<string, string>>) => {
  const fields = yamlFields(facts);
  const fence = fenceFor(fields);
  return `${fence}yaml\n${fields}\n${fence}`;
};

export const mdHeading = (level: 1 | 2 | 3, text: string) => (isBlank(text) ? "" : `${"#".repeat(level)} ${escapeMdInline(text)}`);
export const mdQuote = (text: string) => (isBlank(text) ? "" : `> ${escapeMdInline(text)}`);
export const mdBulletList = (items: ReadonlyArray<string>) =>
  pipe(
    items,
    Array.map((item) => `- ${item}`),
    Array.join("\n")
  );
export const mdFact = (label: string, value: string) => `${escapeMdInline(label)}: ${escapeMdInline(value)}`;
export const mdBody = (blocks: ReadonlyArray<string>) =>
  pipe(
    blocks,
    Array.filter((block) => !isBlank(block)),
    Array.join("\n\n")
  );
export const mdTitledSection = (title: string, body: string) => mdBody([mdHeading(2, title), body]);
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;
export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate("No entries."))}_`;

export const mdLink = (label: string, href: string) => `[${escapeMdInline(label)}](${encodeDestination(href)})`;
export const translatedLink = (label: string, href: string, translate: Translate) => mdLink(translate(label), href);

export const mdIndexEntry = (label: string, canonical: string, twinUrl: string, summary?: string) => {
  // A summary that is absent or blank is the same as no summary: the entry's own punctuation already
  // separates the two links, so an empty value must not leave a double space behind
  const beforeTwin = pipe(
    Option.fromUndefinedOr(summary),
    Option.filter(String.isNonEmpty),
    Option.map((value) => `${escapeMdInline(value)} `),
    Option.getOrElse(() => "")
  );
  return `${mdLink(label, canonical)}: ${beforeTwin}Markdown: ${encodeDestination(twinUrl)}`;
};

export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(Array.map(documents, ({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) =>
  Array.map(profiles, ({ name, href }) => mdFact(name, href));

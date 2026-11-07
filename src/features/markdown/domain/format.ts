// The Markdown document-assembly toolkit: the YAML frontmatter writer, the inline/block builders,
// and the shared link projections every twin and AI index document is assembled from. The
// security-sensitive escape engine these builders apply lives in ./escape; each document builder
// lives beside the family it publishes (./twins, ./detail-twin, ./indexes).

// meta (shared)
import { absoluteUrl, encodeDestination } from "@/features/meta/domain/urls";

// domain
import { escapeMdInline } from "./escape";

// types
import type { Translate } from "@/domain/models";
import type { MarkdownTwin } from "./models";

const FRONTMATTER_DELIMITER = "---";
const DEMOTE_HEADINGS = /^(#{1,4})(?= )/gm;

// A block whose only content is whitespace still renders its opening marker — a stray `>` or a
// heading with no text — which is a block a parser has to reconcile against no content. Both
// forms count as empty, so mdBody's filter drops them instead.
const isBlank = (text: string) => text.trim() === "";

// JSON quoting is valid for YAML double-quoted scalars except for DEL, the C1 controls and the two
// Unicode line separators: a value carrying one of them would produce frontmatter a YAML parser
// rejects outright, which is a document an indexer cannot read at all.
const YAML_UNSAFE_CHARACTERS = /[\u007f-\u009f\u2028\u2029]/g;

// Quotes a value as a YAML double-quoted scalar, escaping the characters JSON.stringify leaves raw.
const yamlValue = (value: string) => JSON.stringify(value).replace(YAML_UNSAFE_CHARACTERS, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);

const yamlFields = (fields: Readonly<Record<string, string>>) =>
  Object.entries(fields)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join("\n");

// The twin's identity block, delimited for a document that is the twin itself.
export const frontmatter = (fields: Readonly<Record<string, string>>) => [FRONTMATTER_DELIMITER, yamlFields(fields), FRONTMATTER_DELIMITER].join("\n");

// The twin as served: its facts as frontmatter, then its body.
export const twinDocument = ({ facts, body }: MarkdownTwin) => mdDocument([frontmatter(facts), body]);

// The demotion a twin's own headline takes when it is republished inside another document: the
// companion wraps twins under its own site H1, so a twin heading is demoted two levels
// (H1 → H3, H2 → H4) to keep a single-document hierarchy. `#{1,4}` is the closed set the twin
// builders can emit, so nothing deeper is ever left sitting above a section it belongs to.
export const demoteHeadings = (markdown: string) => markdown.replace(DEMOTE_HEADINGS, (hashes) => `${hashes}##`);

// An embedded block must fence with more backticks than the longest run it contains, or an authored
// value carrying that run closes the fence and the remaining facts publish as document prose.
const fenceFor = (content: string) => {
  const runs = content.match(/`+/g) ?? [];
  const longest = runs.reduce((longest, run) => Math.max(longest, run.length), 0);

  return "`".repeat(Math.max(3, longest + 1));
};

// The twin's facts, fenced for embedding inside another document.
export const fencedFacts = (facts: Readonly<Record<string, string>>) => {
  const fields = yamlFields(facts);
  const fence = fenceFor(fields);

  return `${fence}yaml\n${fields}\n${fence}`;
};

export const mdHeading = (level: 1 | 2 | 3, text: string) => (isBlank(text) ? "" : `${"#".repeat(level)} ${escapeMdInline(text)}`);
// A pull quote over an empty description is an empty blockquote, which reads as a stray `>` marker
// a parser has to reconcile; mdBody drops the empty block instead.
export const mdQuote = (text: string) => (isBlank(text) ? "" : `> ${escapeMdInline(text)}`);
export const mdBulletList = (items: ReadonlyArray<string>) => items.map((item) => `- ${item}`).join("\n");
export const mdFact = (label: string, value: string) => `${escapeMdInline(label)}: ${escapeMdInline(value)}`;
export const mdBody = (blocks: ReadonlyArray<string>) => blocks.filter(Boolean).join("\n\n");
export const mdTitledSection = (title: string, body: string) => mdBody([mdHeading(2, title), body]);
export const mdDocument = (blocks: ReadonlyArray<string>) => `${mdBody(blocks)}\n`;
export const mdEmptyMarker = (translate: Translate) => `_${escapeMdInline(translate("No entries."))}_`;

export const mdLink = (label: string, href: string) => `[${escapeMdInline(label)}](${encodeDestination(href)})`;

export const translatedLink = (label: string, href: string, translate: Translate) => mdLink(translate(label), href);

export const mdIndexEntry = (label: string, canonical: string, twinUrl: string, summary?: string) => {
  const beforeTwin = summary === undefined ? "" : `${escapeMdInline(summary)} `;
  // The twin URL is an embedded destination exactly like mdLink's href, so it takes the same
  // encoding: a raw ")" or space would otherwise close or truncate the entry.
  return `${mdLink(label, canonical)}: ${beforeTwin}Markdown: ${encodeDestination(twinUrl)}`;
};

// --- Shared link projections ---

export const mdDocumentLinks = (documents: ReadonlyArray<{ readonly label: string; readonly href: string }>, translate: Translate) =>
  mdBulletList(documents.map(({ label, href }) => translatedLink(label, absoluteUrl(href), translate)));

export const mdProfileLinks = (profiles: ReadonlyArray<{ readonly name: string; readonly href: string }>) =>
  profiles.map(({ name, href }) => mdFact(name, href));

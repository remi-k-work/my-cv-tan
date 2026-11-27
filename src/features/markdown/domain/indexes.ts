// services, features, and other libraries
import { Array, Record, pipe } from "effect";
import { partitionExperiences } from "@/features/experience/domain/helpers";
import { experienceSeo } from "@/features/meta/domain/seo";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import {
  demoteHeadings,
  fencedFacts,
  mdBody,
  mdBulletList,
  mdDocument,
  mdDocumentLinks,
  mdFact,
  mdHeading,
  mdIndexEntry,
  mdLink,
  mdProfileLinks,
  mdQuote,
  mdTitledSection,
} from "./format";
import { escapeMd } from "./escape";
import { experienceEntry, experienceLines, pageEntry, PAGE_ENTRIES } from "./catalogue";
import { SOURCE_CONTEXT } from "./models";
import { buildExperienceMd, buildPageDocument } from "./twins";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { IndexEntry } from "./catalogue";
import type { MarkdownTwin, PageContent } from "./models";

interface SourceDocument {
  readonly entry: IndexEntry;
  readonly twin: MarkdownTwin;
  readonly markdownUrl: string;
}

// constants
import { CONTENT_SIGNAL, DISCOVERY_DOCUMENTS, DOWNLOADABLE_DOCUMENTS, LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/discovery";
import {
  CONTACT_EMAIL,
  HOME_COUNTRY,
  HOME_LOCATION,
  HOME_TITLE,
  JOB_TITLE,
  KNOWS_ABOUT,
  LANG_PARAM,
  PERSON_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
} from "@/domain/site";
import { DEFAULT_LANGUAGE, HOME_PATH, SITE_LANGUAGE_NAMES, SITE_LANGUAGES } from "@/domain/constants";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";

const PINNABLE_LANGUAGES = Array.filter(SITE_LANGUAGES, (language) => language !== DEFAULT_LANGUAGE);
const LANGUAGE_PINS = Array.map(
  PINNABLE_LANGUAGES,
  (language) =>
    `Use \`?${LANG_PARAM}=${language}\` on a \`.md\` URL to request ${SITE_LANGUAGE_NAMES[language]} explicitly; replace any existing \`${LANG_PARAM}\` value rather than appending a second parameter`
);

export const AI_NOTES = [
  `Reuse is permitted for search, AI input and AI training (\`Content-Signal: ${CONTENT_SIGNAL}\`).`,
  `Markdown page twins follow the request's language preferences. ${Array.join(LANGUAGE_PINS, "; ")}; ${SITE_LANGUAGE_NAMES[DEFAULT_LANGUAGE]} is the fallback when no supported preference is present. The llms.txt indexes are English discovery documents.`,
  "Every page has a machine-readable Markdown twin; fetch one linked `.md` page at a time, or the single-request full-content document for everything at once.",
  "Always cite the clean canonical HTML URL from each document's frontmatter (`canonical:`), not the `.md` URL.",
  "Structured data (JSON-LD) is embedded in every page head.",
  "Every published page twin states its headline facts as frontmatter (`title`, `description`, `author`, `canonical`, `lang`, `type`), so a document can be indexed without reading the body.",
  "Experience twins also expose `role`, `company`, `year` and optional `skills`, `repository`, `live`, `video` and `image` facts; `image_alt`, `image_type`, `image_width` and `image_height` describe an image when present.",
] as const;

const SINGLE_REQUEST_NOTE = `The complete content of every page is also available in a single request: ${LLMS_FULL_TXT_INDEX.url}.`;

const ABOUT_DETAILS = mdBulletList([
  mdFact("Name", SITE_NAME),
  mdFact("Website", SITE_URL),
  mdFact("Email", CONTACT_EMAIL),
  mdFact("Role", `${JOB_TITLE} (self-taught)`),
  mdFact("Based in", `${HOME_LOCATION} (${HOME_COUNTRY})`),
  mdFact("Site languages", pipe(SITE_LANGUAGE_NAMES, Record.values, Array.join(" and "))),
  mdFact("Focus", Array.join(KNOWS_ABOUT, ", ")),
]);

const ABOUT_SECTION = mdTitledSection("About", ABOUT_DETAILS);

const notes = (additional: ReadonlyArray<string>) => mdBulletList([...AI_NOTES, ...additional]);

// Background and guidance belong before the first H2 in llms.txt: every H2 in that discovery
// document is reserved for a file list; the full-content companion is free to use headed sections
const INDEX_NOTES = notes([SINGLE_REQUEST_NOTE]);
const COMPANION_NOTES_SECTION = mdTitledSection("Notes for AI systems", notes([]));

const discoveryLines = (documents: ReadonlyArray<(typeof DISCOVERY_DOCUMENTS)[number]>) =>
  Array.map(documents, ({ name, summary, url }) => `${mdLink(name, url)}: ${summary}.`);

export const DISCOVERY_LINES = discoveryLines(DISCOVERY_DOCUMENTS);
// An index already is its own discovery document; only list the other crawl surfaces
const discoverySection = (selfUrl: string) =>
  mdTitledSection("Discovery", mdBulletList(discoveryLines(Array.filter(DISCOVERY_DOCUMENTS, ({ url }) => url !== selfUrl))));
export const SITE_OPENING: ReadonlyArray<string> = [mdHeading(1, SITE_NAME), mdQuote(HOME_TITLE), escapeMd(PERSON_DESCRIPTION)];
const entryTwinUrl = (entry: IndexEntry) => markdownTwinUrl(entry.mdHref, SOURCE_CONTEXT.preferredLanguage);
const sourceDocument = (entry: IndexEntry, twin: MarkdownTwin): SourceDocument => ({ entry, twin, markdownUrl: entryTwinUrl(entry) });

const PAGES_SECTION = mdTitledSection(
  "Pages",
  mdBulletList([
    // The twin URL comes from the same helper the full document's table of contents and its
    // attribution block use, so the three spellings of "where this page's twin lives" cannot drift
    ...Array.map(PAGE_ENTRIES, (entry) => mdIndexEntry(entry.name, entry.canonical, entryTwinUrl(entry), entry.summary)),
    `${mdLink("Full site content", LLMS_FULL_TXT_INDEX.url)}: every page above in one document, for single-request ingestion.`,
  ])
);

const OPTIONAL_SECTION = mdTitledSection("Optional", mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, SOURCE_CONTEXT.translate));
const PROFILES_SECTION = mdTitledSection("Profiles", mdBulletList(mdProfileLinks(SOCIAL_PROFILES)));

const LANGUAGE_VARIANTS = mdBulletList(
  Array.map(
    PINNABLE_LANGUAGES,
    (language) =>
      `${SITE_LANGUAGE_NAMES[language]}: every listed page is also available at its twin URL with \`?${LANG_PARAM}=${language}\` (e.g. ${markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, language)}). Replace any existing \`${LANG_PARAM}\` value; ${SITE_LANGUAGE_NAMES[DEFAULT_LANGUAGE]} is the source language.`
  )
);

const experienceSection = (title: string, experiences: ExperienceList) =>
  Array.match(experiences, {
    // An empty file list has no discovery value; omit its section rather than publishing a bullet
    // without the link every llms.txt file-list item requires.
    onEmpty: () => "",
    onNonEmpty: () => mdTitledSection(title, experienceLines({ experiences, ...SOURCE_CONTEXT, mode: "index" })),
  });

const COMPANION_CONTEXT = { ...SOURCE_CONTEXT, includeNavigation: false } as const;

const sourceDocuments = (content: PageContent): ReadonlyArray<SourceDocument> => [
  ...Array.map(STATIC_PAGE_PATHS, (pagePath) => sourceDocument(pageEntry(pagePath), buildPageDocument(pagePath, content, COMPANION_CONTEXT))),
  ...Array.map(content.experienceList, (experience) => {
    const experienceDocument = experienceSeo({ experience, preferredLanguage: DEFAULT_LANGUAGE });
    return sourceDocument(experienceEntry(experienceDocument), buildExperienceMd({ seo: experienceDocument, ...COMPANION_CONTEXT }));
  }),
];

// Builds the concise llms.txt discovery index
export const buildLlmsTxt = (experienceList: ExperienceList) => {
  const [employment, projects] = partitionExperiences(experienceList);

  return mdDocument([
    ...SITE_OPENING,
    ABOUT_DETAILS,
    INDEX_NOTES,
    LANGUAGE_VARIANTS,
    PAGES_SECTION,
    experienceSection("Work Experience", employment),
    experienceSection("Portfolio Projects", projects),
    PROFILES_SECTION,
    discoverySection(LLMS_TXT_INDEX.url),
    OPTIONAL_SECTION,
  ]);
};

// Builds the full concatenated llms-full.txt document for single-request ingestion
export const buildLlmsFullTxt = (content: PageContent) => {
  const documents = sourceDocuments(content);

  return mdDocument([
    ...SITE_OPENING,
    `Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with Source and Markdown links and its identity facts as YAML, then includes the twin content with headings demoted to preserve one document hierarchy and without its repeated navigation section. Cite the canonical HTML URL, not this file.`,
    ABOUT_SECTION,
    mdTitledSection(
      "Table of Contents",
      mdBulletList(Array.map(documents, ({ entry, markdownUrl }) => mdIndexEntry(entry.name, entry.canonical, markdownUrl)))
    ),
    discoverySection(LLMS_FULL_TXT_INDEX.url),
    ...Array.map(documents, ({ entry, twin, markdownUrl }) =>
      mdBody([mdHeading(2, entry.name), mdLink("Source", entry.canonical), mdLink("Markdown", markdownUrl), fencedFacts(twin.facts), demoteHeadings(twin.body)])
    ),
    COMPANION_NOTES_SECTION,
  ]);
};

export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n\n${AI_NOTES[0]}\n`;

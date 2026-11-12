// services, features, and other libraries
import { Array, Record, pipe } from "effect";
import { partitionExperiences } from "@/features/experience/domain/helpers";
import { experienceSeo } from "@/features/meta/domain/seo";
import { absoluteUrl, encodeDestination, markdownTwinUrl } from "@/features/meta/domain/urls";
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
import { escapeMd, escapeMdInline } from "./escape";
import { experienceEntry, pageEntry } from "./catalogue";
import { SOURCE_CONTEXT } from "./context";
import { buildExperienceMd } from "./detail-twin";
import { experienceLines } from "./listings";
import { buildContactMd, buildEducationMd, buildHomeMd } from "./twins";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PagePath, PageTitles } from "@/domain/models";
import type { IndexEntry } from "./catalogue";
import type { MarkdownTwin } from "./models";

interface SourceContent {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
  readonly educationList: EducationList;
}

interface SourceDocument {
  readonly entry: IndexEntry;
  readonly twin: MarkdownTwin;
}

// constants
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS, LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX, ROBOTS_TXT_HREF, SITEMAP_HREF } from "@/features/meta/domain/discovery";
import {
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
} from "@/features/meta/domain/site";
import { CONTACT_PATH, DEFAULT_LANGUAGE, EDUCATION_PATH, HOME_PATH, SITE_LANGUAGE_NAMES, SITE_LANGUAGES } from "@/domain/constants";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";
import { PAGE_ENTRIES } from "./catalogue";

const PINNABLE_LANGUAGES = Array.filter(SITE_LANGUAGES, (language) => language !== DEFAULT_LANGUAGE);
const LANGUAGE_PINS = Array.map(
  PINNABLE_LANGUAGES,
  (language) => `Append \`?${LANG_PARAM}=${language}\` to any \`.md\` URL to request ${SITE_LANGUAGE_NAMES[language]} explicitly`
);

export const AI_NOTES = [
  `Reuse is permitted for search, AI input and AI training (\`Content-Signal: ${CONTENT_SIGNAL}\`).`,
  `Markdown responses follow the request's language preferences. ${Array.join(LANGUAGE_PINS, "; ")}; ${SITE_LANGUAGE_NAMES[DEFAULT_LANGUAGE]} is the fallback when no supported preference is present.`,
  "Every page has a machine-readable Markdown twin; fetch one linked `.md` page at a time, or the single-request full-content document for everything at once.",
  "Always cite the clean canonical HTML URL from each document's frontmatter (`canonical:`), not the `.md` URL.",
  "Structured data (JSON-LD) is embedded in every page head.",
  "Every page twin states its headline facts as frontmatter (`title`, `description`, `author`, `canonical`, `lang`, `type`), so a document can be indexed without reading the body.",
] as const;

const SINGLE_REQUEST_NOTE = `The complete content of every page is also available in a single request: ${LLMS_FULL_TXT_INDEX.url}.`;

const ABOUT_SECTION = mdTitledSection(
  "About",
  mdBody([
    "Self-taught web developer portfolio. Every page has a machine-readable Markdown twin.",
    mdBulletList([
      mdFact("Name", SITE_NAME),
      mdFact("Website", SITE_URL),
      mdFact("Role", `${JOB_TITLE} (self-taught)`),
      mdFact("Based in", `${HOME_LOCATION} (${HOME_COUNTRY})`),
      mdFact("Site languages", pipe(SITE_LANGUAGE_NAMES, Record.values, Array.join(" and "))),
      mdFact("Focus", Array.join(KNOWS_ABOUT, ", ")),
    ]),
  ])
);

const notesSection = (additional: ReadonlyArray<string>) => mdTitledSection("Notes for AI systems", mdBulletList([...AI_NOTES, ...additional]));

const INDEX_NOTES_SECTION = notesSection([SINGLE_REQUEST_NOTE]);
const COMPANION_NOTES_SECTION = notesSection([]);

export const DISCOVERY_LINES: ReadonlyArray<string> = Array.map(
  [
    { name: LLMS_TXT_INDEX.name, summary: "this index", url: LLMS_TXT_INDEX.url },
    { name: LLMS_FULL_TXT_INDEX.name, summary: "the complete site in one document", url: LLMS_FULL_TXT_INDEX.url },
    { name: "robots.txt", summary: "crawl directives", url: absoluteUrl(ROBOTS_TXT_HREF) },
    { name: "sitemap.xml", summary: "sitemap", url: absoluteUrl(SITEMAP_HREF) },
  ],
  ({ name, summary, url }) => `${mdLink(name, url)}: ${summary}.`
);

const DISCOVERY_SECTION = mdTitledSection("Discovery", mdBulletList(DISCOVERY_LINES));
export const SITE_OPENING: ReadonlyArray<string> = [mdHeading(1, SITE_NAME), mdQuote(HOME_TITLE), escapeMd(PERSON_DESCRIPTION)];
const entryTwinUrl = (entry: IndexEntry) => markdownTwinUrl(entry.mdHref, SOURCE_CONTEXT.preferredLanguage);

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

const LANGUAGE_VARIANTS_SECTION = mdTitledSection(
  "Language Variants",
  mdBulletList(
    Array.map(
      PINNABLE_LANGUAGES,
      (language) =>
        `${SITE_LANGUAGE_NAMES[language]}: every page above is also available at its twin URL with \`?${LANG_PARAM}=${language}\` appended (e.g. ${markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, language)}). ${SITE_LANGUAGE_NAMES[DEFAULT_LANGUAGE]} is the source language.`
    )
  )
);

// The English source documents, keyed exhaustively so a page added to the catalogue must be built here too
const SOURCE_PAGE_DOCUMENTS: Record<PagePath, (content: SourceContent) => MarkdownTwin> = {
  [HOME_PATH]: ({ pageTitles, experienceList }) => buildHomeMd({ pageTitles, experienceList, ...SOURCE_CONTEXT }),
  [EDUCATION_PATH]: ({ pageTitles, educationList }) => buildEducationMd({ pageTitles, educationList, ...SOURCE_CONTEXT }),
  [CONTACT_PATH]: ({ pageTitles }) => buildContactMd({ pageTitles, ...SOURCE_CONTEXT }),
};

const sourceDocuments = (content: SourceContent): ReadonlyArray<SourceDocument> => [
  ...Array.map(STATIC_PAGE_PATHS, (pagePath) => ({ entry: pageEntry(pagePath), twin: SOURCE_PAGE_DOCUMENTS[pagePath](content) })),
  ...Array.map(content.experienceList, (experience) => {
    const seo = experienceSeo({ experience, preferredLanguage: DEFAULT_LANGUAGE });
    return { entry: experienceEntry(seo), twin: buildExperienceMd({ seo, translate: SOURCE_CONTEXT.translate }) };
  }),
];

// Builds the concise llms.txt discovery index
export const buildLlmsTxt = (experienceList: ExperienceList) => {
  const [employment, projects] = partitionExperiences(experienceList);

  return mdDocument([
    ...SITE_OPENING,
    ABOUT_SECTION,
    PAGES_SECTION,
    mdTitledSection("Work Experience", experienceLines({ experiences: employment, ...SOURCE_CONTEXT, mode: "index" })),
    mdTitledSection("Portfolio Projects", experienceLines({ experiences: projects, ...SOURCE_CONTEXT, mode: "index" })),
    LANGUAGE_VARIANTS_SECTION,
    PROFILES_SECTION,
    DISCOVERY_SECTION,
    OPTIONAL_SECTION,
    INDEX_NOTES_SECTION,
  ]);
};

// Builds the full concatenated llms-full.txt document for single-request ingestion
export const buildLlmsFullTxt = (content: SourceContent) => {
  const documents = sourceDocuments(content);

  return mdDocument([
    ...SITE_OPENING,
    `Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with its canonical HTML URL after "Source:", its Markdown twin after "Markdown:", and its identity facts as YAML, then includes the twin content with headings demoted to preserve one document hierarchy. Cite the canonical HTML URL, not this file.`,
    ABOUT_SECTION,
    mdTitledSection("Table of Contents", mdBulletList(Array.map(documents, ({ entry }) => mdIndexEntry(entry.name, entry.canonical, entryTwinUrl(entry))))),
    DISCOVERY_SECTION,
    ...Array.map(documents, ({ entry, twin }) =>
      mdBody([
        mdHeading(2, entry.name),
        `Source: ${escapeMdInline(entry.canonical)}`,
        `Markdown: ${encodeDestination(entryTwinUrl(entry))}`,
        fencedFacts(twin.facts),
        demoteHeadings(twin.body),
      ])
    ),
    COMPANION_NOTES_SECTION,
  ]);
};

export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n\n${AI_NOTES[0]}\n`;

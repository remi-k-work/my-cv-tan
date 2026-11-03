// Machine-readable discovery indexes for AI systems (llms.txt and llms-full.txt).

// services, features, and other libraries
import { allEntries } from "./catalogue";
import { experienceLines } from "./experience";
import {
  demoteHeadings,
  escapeMd,
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
  translateSource,
} from "./formatting";
import { absoluteUrl, markdownTwinUrl } from "@/features/meta/domain/url";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { TwinData } from "./catalogue";

// constants
import { DOWNLOADABLE_DOCUMENTS, SOURCE_COPY } from "./constants";
import {
  CONTENT_SIGNAL,
  HOME_COUNTRY,
  HOME_COUNTRY_NAME,
  HOME_LOCALITY,
  HOME_MD_HREF,
  HOME_TITLE,
  JOB_TITLE,
  KNOWS_ABOUT,
  PERSON_DESCRIPTION,
  ROBOTS_TXT_HREF,
  SITE_LANGUAGE_NAMES,
  SITE_NAME,
  SITE_URL,
  SITEMAP_HREF,
  SOCIAL_PROFILES,
} from "@/features/meta/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/links";
import { PAGE_ENTRIES } from "./catalogue";

// --- Shared AI Index Sections and Copy ---

const AI_NOTES = [
  `Reuse is permitted for search, AI input and AI training (\`Content-Signal: ${CONTENT_SIGNAL}\`).`,
  "Markdown responses follow the request's language preferences. Append `?lang=pl` to any `.md` URL to request Polish explicitly; English is the fallback when no supported preference is present.",
  "Every page has a machine-readable Markdown twin; fetch one linked `.md` page at a time, or the single-request full-content document for everything at once.",
  "Always cite the clean canonical HTML URL from each document's frontmatter (`canonical:`), not the `.md` URL.",
  "Structured data (JSON-LD) is embedded in every page head.",
  "Every twin states its headline facts as frontmatter (`title`, `description`, `type`, `lang`, `canonical`), so a document can be indexed without reading the body.",
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
      mdFact("Based in", `${HOME_LOCALITY}, ${HOME_COUNTRY_NAME} (${HOME_COUNTRY})`),
      mdFact("Site languages", Object.values(SITE_LANGUAGE_NAMES).join(" and ")),
      mdFact("Focus", KNOWS_ABOUT.join(", ")),
    ]),
  ])
);

const notesSection = (additional: ReadonlyArray<string>) => mdTitledSection("Notes for AI systems", mdBulletList([...AI_NOTES, ...additional]));

const INDEX_NOTES_SECTION = notesSection([SINGLE_REQUEST_NOTE]);

const COMPANION_NOTES_SECTION = notesSection([]);

export const DISCOVERY_LINES: ReadonlyArray<string> = [
  { name: LLMS_TXT_INDEX.name, summary: "this index", url: LLMS_TXT_INDEX.url },
  { name: LLMS_FULL_TXT_INDEX.name, summary: "the complete site in one document", url: LLMS_FULL_TXT_INDEX.url },
  { name: "robots.txt", summary: "crawl directives", url: absoluteUrl(ROBOTS_TXT_HREF) },
  { name: "sitemap.xml", summary: "sitemap", url: absoluteUrl(SITEMAP_HREF) },
].map(({ name, summary, url }) => `${mdLink(name, url)}: ${summary}.`);

const DISCOVERY_SECTION = mdTitledSection("Discovery", mdBulletList(DISCOVERY_LINES));

export const SITE_OPENING: ReadonlyArray<string> = [mdHeading(1, SITE_NAME), mdQuote(HOME_TITLE), escapeMd(PERSON_DESCRIPTION)];

// --- Document Builders ---

const PAGES_SECTION = mdTitledSection(
  "Pages",
  mdBulletList([
    ...PAGE_ENTRIES.map(({ name, canonical, twinUrl, summary }) => mdIndexEntry(name, canonical, twinUrl, summary)),
    `${mdLink("Full site content", LLMS_FULL_TXT_INDEX.url)}: every page above in one document, for single-request ingestion.`,
  ])
);

const OPTIONAL_SECTION = mdTitledSection("Optional", mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, translateSource));

const PROFILES_SECTION = mdTitledSection("Profiles", mdBulletList(mdProfileLinks(SOCIAL_PROFILES)));

// Builds the llms.txt index document.
export const buildLlmsTxt = (experienceList: ExperienceList) =>
  mdDocument([
    ...SITE_OPENING,
    ABOUT_SECTION,
    PAGES_SECTION,
    mdTitledSection("Work Experience", experienceLines({ experienceList, type: "e", ...SOURCE_COPY, entry: "canonical" })),
    mdTitledSection("Portfolio Projects", experienceLines({ experienceList, type: "p", ...SOURCE_COPY, entry: "canonical" })),
    mdTitledSection(
      "Language Variants",
      mdBulletList([
        `Polish: every page above is also available at its twin URL with \`?lang=pl\` appended (e.g. ${markdownTwinUrl(HOME_MD_HREF, "pl")}). English is the source language.`,
      ])
    ),
    PROFILES_SECTION,
    DISCOVERY_SECTION,
    OPTIONAL_SECTION,
    INDEX_NOTES_SECTION,
  ]);

// Builds the llms-full.txt single-request concatenated companion document.
export const buildLlmsFullTxt = ({ pageTitles, experienceList, educationList }: TwinData) => {
  const documents = allEntries(experienceList);

  return mdDocument([
    ...SITE_OPENING,
    'Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with its canonical HTML URL after "Source:", its Markdown twin after "Markdown:", and ends with the twin verbatim. Cite the canonical HTML URL, not this file.',
    ABOUT_SECTION,
    mdTitledSection("Table of Contents", mdBulletList(documents.map(({ name, canonical, twinUrl }) => mdIndexEntry(name, canonical, twinUrl)))),
    DISCOVERY_SECTION,
    ...documents.map(({ name, canonical, twinUrl, render }) =>
      mdBody([
        mdHeading(2, name),
        `Source: ${canonical}`,
        `Markdown: ${twinUrl}`,
        demoteHeadings(render({ pageTitles, experienceList, educationList }).trimEnd()),
      ])
    ),
    COMPANION_NOTES_SECTION,
  ]);
};

// Plain-text 503 fallback body for AI index files.
export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n`;

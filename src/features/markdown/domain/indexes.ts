// services, features, and other libraries
import { partitionExperiences } from "@/features/experience/domain/helpers";
import { experienceLines } from "./experience-lines";
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
import { allEntries } from "./helpers";
import { absoluteUrl, encodeDestination, markdownTwinUrl } from "@/features/meta/domain/urls";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { TwinData } from "./models";

// constants
import {
  HOME_COUNTRY,
  HOME_LOCATION,
  HOME_TITLE,
  JOB_TITLE,
  KNOWS_ABOUT,
  LANG_PARAM,
  LLMS_FULL_TXT_INDEX,
  LLMS_TXT_INDEX,
  PERSON_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
} from "@/features/meta/domain/constants";
import { PAGE_ENTRIES } from "./constants";
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS, ROBOTS_TXT_HREF, SITEMAP_HREF } from "@/features/meta/domain/constants";
import { DEFAULT_LANGUAGE, HOME_PATH, SITE_LANGUAGE_NAMES, SITE_LANGUAGES } from "@/domain/constants";
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { SOURCE_COPY } from "./constants";

const PINNABLE_LANGUAGES = SITE_LANGUAGES.filter((language) => language !== DEFAULT_LANGUAGE);
const LANGUAGE_PINS = PINNABLE_LANGUAGES.map(
  (language) => `Append \`?${LANG_PARAM}=${language}\` to any \`.md\` URL to request ${SITE_LANGUAGE_NAMES[language]} explicitly`
);

export const AI_NOTES = [
  `Reuse is permitted for search, AI input and AI training (\`Content-Signal: ${CONTENT_SIGNAL}\`).`,
  `Markdown responses follow the request's language preferences. ${LANGUAGE_PINS.join("; ")}; ${SITE_LANGUAGE_NAMES[DEFAULT_LANGUAGE]} is the fallback when no supported preference is present.`,
  "Every page has a machine-readable Markdown twin; fetch one linked `.md` page at a time, or the single-request full-content document for everything at once.",
  "Always cite the clean canonical HTML URL from each document's frontmatter (`canonical:`), not the `.md` URL.",
  "Structured data (JSON-LD) is embedded in every page head.",
  "Every twin states its headline facts as frontmatter (`title`, `description`, `author`, `canonical`, `lang`, `type`), so a document can be indexed without reading the body.",
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

const PAGES_SECTION = mdTitledSection(
  "Pages",
  mdBulletList([
    ...PAGE_ENTRIES.map(({ name, canonical, twinUrl, summary }) => mdIndexEntry(name, canonical, twinUrl, summary)),
    `${mdLink("Full site content", LLMS_FULL_TXT_INDEX.url)}: every page above in one document, for single-request ingestion.`,
  ])
);

const OPTIONAL_SECTION = mdTitledSection("Optional", mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, SOURCE_COPY.translate));
const PROFILES_SECTION = mdTitledSection("Profiles", mdBulletList(mdProfileLinks(SOCIAL_PROFILES)));

const LANGUAGE_VARIANTS_SECTION = mdTitledSection(
  "Language Variants",
  mdBulletList(
    PINNABLE_LANGUAGES.map(
      (language) =>
        `${SITE_LANGUAGE_NAMES[language]}: every page above is also available at its twin URL with \`?${LANG_PARAM}=${language}\` appended (e.g. ${markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, language)}). ${SITE_LANGUAGE_NAMES[DEFAULT_LANGUAGE]} is the source language.`
    )
  )
);

// Builds the concise llms.txt discovery index
export const buildLlmsTxt = (experienceList: ExperienceList) => {
  const [employment, projects] = partitionExperiences(experienceList);

  return mdDocument([
    ...SITE_OPENING,
    ABOUT_SECTION,
    PAGES_SECTION,
    mdTitledSection("Work Experience", experienceLines({ experiences: employment, ...SOURCE_COPY, entry: "canonical" })),
    mdTitledSection("Portfolio Projects", experienceLines({ experiences: projects, ...SOURCE_COPY, entry: "canonical" })),
    LANGUAGE_VARIANTS_SECTION,
    PROFILES_SECTION,
    DISCOVERY_SECTION,
    OPTIONAL_SECTION,
    INDEX_NOTES_SECTION,
  ]);
};

// Builds the full concatenated llms-full.txt document for single-request ingestion
export const buildLlmsFullTxt = ({ pageTitles, experienceList, educationList }: TwinData) => {
  const documents = allEntries(experienceList);

  return mdDocument([
    ...SITE_OPENING,
    `Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with its canonical HTML URL after "Source:", its Markdown twin after "Markdown:", and its identity facts as YAML, then includes the twin content with headings demoted to preserve one document hierarchy. Cite the canonical HTML URL, not this file.`,
    ABOUT_SECTION,
    mdTitledSection("Table of Contents", mdBulletList(documents.map(({ name, canonical, twinUrl }) => mdIndexEntry(name, canonical, twinUrl)))),
    DISCOVERY_SECTION,
    ...documents.map(({ name, canonical, twinUrl, render }) => {
      const twin = render({ pageTitles, experienceList, educationList });
      return mdBody([
        mdHeading(2, name),
        `Source: ${escapeMdInline(canonical)}`,
        `Markdown: ${encodeDestination(twinUrl)}`,
        fencedFacts(twin.facts),
        demoteHeadings(twin.body),
      ]);
    }),
    COMPANION_NOTES_SECTION,
  ]);
};

export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n\n${AI_NOTES[0]}\n`;

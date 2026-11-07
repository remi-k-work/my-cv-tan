// AI index documents (llms.txt / llms-full.txt) and their shared sections/copy.
// The experience listing sections both documents print live in ./experience-lines; twin
// declarations and builders live there and in ./detail-twin.

// services, features, and other libraries
import { partitionExperiences } from "@/features/experience/domain/helpers";

// types
import type { ExperienceList } from "@/features/experience/domain/models";

// meta (shared)
import {
  HOME_COUNTRY,
  HOME_LOCATION,
  HOME_TITLE,
  JOB_TITLE,
  KNOWS_ABOUT,
  PERSON_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
} from "@/features/meta/domain/identity";
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS, ROBOTS_TXT_HREF, SITEMAP_HREF } from "@/features/meta/domain/discovery";
import { DEFAULT_LANGUAGE, SITE_LANGUAGE_NAMES } from "@/features/meta/domain/languages";
import { HOME_PATH, SITE_LANGUAGES } from "@/domain/constants";
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { LANG_PARAM, absoluteUrl, encodeDestination, markdownTwinUrl } from "@/features/meta/domain/urls";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/link-tags";

// domain
import { SOURCE_COPY } from "./copy";
import { experienceLines } from "./experience-lines";

// formatting primitives
import { escapeMd, escapeMdInline } from "./escape";
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
import type { TwinData } from "./models";
import { PAGE_ENTRIES, allEntries } from "./catalogue";

// --- Shared AI Index Sections and Copy ---

// The languages a twin may be pinned to beside the source language. Derived from the same
// vocabulary the twin builder writes and its request parser reads, so the guidance below can never
// name a parameter, or a language, this site does not actually publish.
const PINNABLE_LANGUAGES = SITE_LANGUAGES.filter((language) => language !== DEFAULT_LANGUAGE);

const LANGUAGE_PINS = PINNABLE_LANGUAGES.map(
  (language) => `Append \`?${LANG_PARAM}=${language}\` to any \`.md\` URL to request ${SITE_LANGUAGE_NAMES[language]} explicitly`
);

// The keys every twin's frontmatter carries, in the order `twinIdentity` writes them. The reuse
// note below names them to an AI reader, so the set is compared against the built facts in
// ./__tests__ rather than trusted to stay in step on its own.
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

// --- AI Index document sections ---

const PAGES_SECTION = mdTitledSection(
  "Pages",
  mdBulletList([
    ...PAGE_ENTRIES.map(({ name, canonical, twinUrl, summary }) => mdIndexEntry(name, canonical, twinUrl, summary)),
    `${mdLink("Full site content", LLMS_FULL_TXT_INDEX.url)}: every page above in one document, for single-request ingestion.`,
  ])
);

const OPTIONAL_SECTION = mdTitledSection("Optional", mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, SOURCE_COPY.translate));
const PROFILES_SECTION = mdTitledSection("Profiles", mdBulletList(mdProfileLinks(SOCIAL_PROFILES)));

// One pinned document per language beside the English source, walked from the home twin so a
// reader sees the shape of the pin before fetching any page.
const LANGUAGE_VARIANTS_SECTION = mdTitledSection(
  "Language Variants",
  mdBulletList(
    PINNABLE_LANGUAGES.map(
      (language) =>
        `${SITE_LANGUAGE_NAMES[language]}: every page above is also available at its twin URL with \`?${LANG_PARAM}=${language}\` appended (e.g. ${markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, language)}). ${SITE_LANGUAGE_NAMES[DEFAULT_LANGUAGE]} is the source language.`
    )
  )
);

// Builds the llms.txt index document.
export const buildLlmsTxt = (experienceList: ExperienceList) => {
  // One split for both listings, under this document's own section titles: the same partition the
  // home twin renders, so the two surfaces cannot group an experience differently.
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

// Builds the llms-full.txt single-request concatenated companion document.
export const buildLlmsFullTxt = ({ pageTitles, experienceList, educationList }: TwinData) => {
  const documents = allEntries(experienceList);

  return mdDocument([
    ...SITE_OPENING,
    `Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with its canonical HTML URL after "Source:", its Markdown twin after "Markdown:", its identity facts as YAML, and ends with the twin body verbatim. Cite the canonical HTML URL, not this file.`,
    ABOUT_SECTION,
    mdTitledSection("Table of Contents", mdBulletList(documents.map(({ name, canonical, twinUrl }) => mdIndexEntry(name, canonical, twinUrl)))),
    DISCOVERY_SECTION,
    // The facts are fenced rather than published as a second frontmatter block: inside one
    // document a raw `---` is a thematic break, and its closing line turns the last fact into a
    // setext heading that would collide with the section heading above it.
    ...documents.map(({ name, canonical, twinUrl, render }) => {
      const twin = render({ pageTitles, experienceList, educationList });

      // The canonical is a site-derived URL, so a slug whose first or last character is `_`
      // would otherwise read as emphasis and put half the citation inside it: the same inline
      // escape every other content line takes.
      return mdBody([mdHeading(2, name), `Source: ${escapeMdInline(canonical)}`, `Markdown: ${encodeDestination(twinUrl)}`, fencedFacts(twin.facts), demoteHeadings(twin.body)]);
    }),
    COMPANION_NOTES_SECTION,
  ]);
};

// The first note is the reuse policy, and it is repeated verbatim in the index fallback below: a
// degraded read must still learn what reuse is permitted, rather than depending on a header a proxy
// or intermediate cache may strip from the response it forwards.
const REUSE_NOTE = AI_NOTES[0];

// Plain-text 503 fallback body for AI index files.
export const unavailableIndexBody = (name: string) =>
  `${name} is temporarily unavailable because required portfolio content could not be loaded. Please try again shortly.\n\n${REUSE_NOTE}\n`;

// llms.txt: English-only machine-readable index for AI systems.
import { Array } from "effect";
import { experienceLines } from "./experience";
import { translateSource } from "./text";
import { PAGE_ENTRIES } from "./catalogue";
import { ABOUT_SECTION, DISCOVERY_SECTION, INDEX_NOTES_SECTION, SITE_OPENING } from "./index-copy";
import { mdBulletList, mdDocument, mdDocumentLinks, mdIndexEntry, mdLink, mdProfileLinks, mdTitledSection } from "./blocks";

// types
import type { ExperienceList } from "@/features/experience/domain/models";

// constants
import { DOWNLOADABLE_DOCUMENTS, SOURCE_COPY } from "./constants";
import { HOME_MD_HREF, SOCIAL_PROFILES } from "@/features/meta/domain/constants";
import { LLMS_FULL_TXT_INDEX } from "@/features/meta/domain/links";
import { markdownTwinUrl } from "@/features/meta/domain/url";

const PAGES_SECTION = mdTitledSection(
  "Pages",
  mdBulletList([
    ...Array.map(PAGE_ENTRIES, ({ name, canonical, twinUrl, summary }) => mdIndexEntry(name, canonical, twinUrl, summary)),
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
      mdBulletList([`Polish: every page above is also available at its twin URL with \`?lang=pl\` appended (e.g. ${markdownTwinUrl(HOME_MD_HREF, "pl")}). English is the source language.`])
    ),
    PROFILES_SECTION,
    DISCOVERY_SECTION,
    OPTIONAL_SECTION,
    INDEX_NOTES_SECTION,
  ]);

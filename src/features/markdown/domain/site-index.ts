// services, features, and other libraries
import { Array } from "effect";
import { experienceLines } from "./experience";
import { escapeMdInline, translateSource } from "./text";
import { PAGE_ENTRIES } from "./catalogue";
import { ABOUT_SECTION, notesSection, SITE_OPENING } from "./index-copy";
import { mdBulletList, mdDocument, mdDocumentLinks, mdProfileLinks, mdTitledSection } from "./blocks";

// types
import type { ExperienceList } from "@/features/experience/domain/models";

// constants
import { DOWNLOADABLE_DOCUMENTS, SOURCE_COPY } from "./constants";
import { SOCIAL_PROFILES } from "@/features/meta/domain/constants";
import { DISCOVERY_LINES, LLMS_FULL_TXT_INDEX } from "@/features/meta/domain/links";

// --- llms.txt ---
// The English-only AI index. It owns the section lists only: the identity opening, the reuse notes
// and the key facts are shared with its full-content companion in index-copy.ts, and the catalogue
// of documents both documents cover lives in catalogue.ts — so an index can never advertise a twin
// the companion omits.
//
// Sections are ordered content-first: what the site holds, then where the rest of the retrieval
// surface lives, then what a fetcher may skip. A document that opens with crawl directives makes a
// reader parse plumbing before it reaches a single fact worth citing.

// The page twins come from the same catalogue llms-full.txt concatenates, so this index can never
// advertise a document the companion omits. Each link targets the canonical HTML URL — the citation
// target the notes name — and states the Markdown twin beside it, so a fetcher learns both documents
// from one entry instead of fetching to discover the second.
//
// The label is escaped: a twin name sits inside a Markdown link label, and every other surface that
// publishes one (mdDocumentLinks, translatedLink, the companion's table of contents) escapes it. A
// name carrying "]" would otherwise close the label early and hand a crawler a destination the site
// never published.
const PAGES_SECTION = mdTitledSection(
  "Pages",
  mdBulletList([
    ...Array.map(PAGE_ENTRIES, ({ name, canonical, twinUrl, summary }) => `[${escapeMdInline(name)}](${canonical}): ${summary} Markdown: ${twinUrl}`),
    // The single-request companion is the one entry in this section that is not a twin, so it states
    // what it contains instead of a one-line summary
    `[Full site content](${LLMS_FULL_TXT_INDEX.url}): every page above in one document, for single-request ingestion.`,
  ])
);

// Every machine-readable entry point collected in one place, so a crawler that fetched nothing else
// still learns the whole retrieval surface from this single document. The lines come from the one
// declaration the HTML heads and the Link headers already read, so this section can never list a
// document the rest of the site does not serve.
const DISCOVERY_SECTION = mdTitledSection("Discovery", mdBulletList(DISCOVERY_LINES));

// The llms.txt convention names the last section "Optional": everything a fetcher may skip without
// losing the site's meaning. The downloadable documents are exactly that — the shared table prints
// them the same way the education twin prints them, so a parser applies one list rule to both.
const OPTIONAL_SECTION = mdTitledSection("Optional", mdDocumentLinks(DOWNLOADABLE_DOCUMENTS, translateSource));

// The same labeled profiles the contact twin publishes, so an AI reader learns which URL is which
// instead of matching bare URLs against a site it has to guess the identity of
const PROFILES_SECTION = mdTitledSection("Profiles", mdBulletList(mdProfileLinks(SOCIAL_PROFILES)));

// Machine-readable site index for AI systems (GEO). Every entry names both spellings of its
// document — the canonical HTML URL to cite and the twin to fetch — so a crawler learns each one
// from a single line instead of resolving the second from the first.
export const buildLlmsTxt = (experienceList: ExperienceList) =>
  mdDocument([
    ...SITE_OPENING,
    ABOUT_SECTION,
    PAGES_SECTION,
    // English-only index: the advertised twins are pinned to ?lang=en so they are deterministic
    // instead of a negotiated variant that could differ between fetches.
    //
    // `entry: "canonical"` is the point of the whole section: these lines are citations, so they
    // lead with the clean HTML URL and name the twin beside it, the same shape the Pages section above
    // uses. `twin` would answer a question the reader of an index never asked.
    mdTitledSection("Work Experience", experienceLines({ experienceList, type: "e", ...SOURCE_COPY, entry: "canonical" })),
    mdTitledSection("Portfolio Projects", experienceLines({ experienceList, type: "p", ...SOURCE_COPY, entry: "canonical" })),
    // Language variants: every twin is also available in Polish via ?lang=pl. Advertising the
    // alternate here lets a crawler fetch the localized document without first negotiating a locale.
    mdTitledSection(
      "Language Variants",
      mdBulletList([`- Polish: every page above is also available at its twin URL with \`?lang=pl\` appended (e.g. https://www.remiforge.dev/index.md?lang=pl). English is the source language.`])
    ),
    PROFILES_SECTION,
    DISCOVERY_SECTION,
    OPTIONAL_SECTION,
    // The index — not the companion — is where the single-request pointer helps: a fetcher that has
    // not yet discovered llms-full.txt learns of it here, from the canonical index
    notesSection(true),
  ]);

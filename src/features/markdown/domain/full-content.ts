// services, features, and other libraries
import { Array, String } from "effect";
import { allEntries } from "./catalogue";
import { ABOUT_SECTION, notesSection, SITE_OPENING } from "./index-copy";
import { demoteHeadings, escapeMdInline } from "./text";
import { mdBody, mdBulletList, mdDocument, mdHeading, mdTitledSection } from "./blocks";

// types
import type { TwinData } from "./catalogue";

// constants
import { DISCOVERY_LINES } from "@/features/meta/domain/links";

// --- llms-full.txt ---
// The full-content companion of llms.txt: every Markdown twin concatenated into one document for
// single-request ingestion (Perplexity, ChatGPT, Claude). It shares the opening, the key facts and
// the reuse notes with the index, so a crawler that fetches only this document answers "who is this"
// and "how may I use it" without first discovering llms.txt. The companion is the single document
// an AI fetcher can load once and stop — every surface is reachable from it.

export const buildLlmsFullTxt = ({ pageTitles, experienceList, educationList }: TwinData) => {
  const documents = allEntries(experienceList);

  return mdDocument([
    ...SITE_OPENING,
    // Each document carries both spellings of its identity — the canonical HTML URL to cite and the
    // Markdown twin URL to fetch — so a crawler never has to resolve one from the other
    "Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with its canonical HTML URL after \"Source:\", its Markdown twin after \"Markdown:\", and ends with the twin verbatim. Cite the canonical HTML URL, not this file.",
    // The same dense key facts llms.txt prints: a crawler that fetches only this single-request
    // document answers "who is this and where are they" without first discovering the index
    ABOUT_SECTION,
    // The contents index states both URLs per document, the same shape llms.txt's Pages section
    // uses: a crawler that landed here directly gets a complete navigation index from the top of
    // the file, instead of having to walk to a section to learn which twin to fetch for one page.
    mdTitledSection(
      "Table of Contents",
      mdBulletList(Array.map(documents, ({ name, canonical, twinUrl }) => `[${escapeMdInline(name)}](${canonical}): Markdown: ${twinUrl}`))
    ),
    // The same retrieval-surface map llms.txt carries, so a crawler that fetched only this
    // single-request document never has to backtrack to the index to learn robots.txt and
    // sitemap.xml exist. Without it the companion was the one AI-facing surface that could not be
    // entered directly and still walked away knowing the whole surface.
    mdTitledSection("Discovery", mdBulletList(DISCOVERY_LINES)),
    // Keep twins verbatim in content — frontmatter, prose, links and ordering are byte-identical to
    // the standalone .md document. Only heading depth shifts (see demoteHeadings): the companion
    // spends `#` on the site and `##` on one document, so a parser walks
    //   H2 one document · H3 its headline · H4 its sections · H5 nested entries
    // instead of a flat run of `##` in which "the next document" and "a section of this one" are
    // the same depth. Each twin's own headline then still reads as that document's headline, not as
    // a section of this file. The source header above provides the attribution back to the canonical
    // twin.
    ...Array.map(documents, ({ name, canonical, twinUrl, render }) =>
      mdBody([mdHeading(2, name), `Source: ${canonical}`, `Markdown: ${twinUrl}`, demoteHeadings(String.trimEnd(render({ pageTitles, experienceList, educationList })))])
    ),
    notesSection(false),
  ]);
};

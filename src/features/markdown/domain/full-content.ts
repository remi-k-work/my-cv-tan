// Concatenates all markdown twins for single-request ingestion (llms-full.txt).
import { Array, String } from "effect";
import { allEntries, type TwinData } from "./catalogue";
import { ABOUT_SECTION, COMPANION_NOTES_SECTION, DISCOVERY_SECTION, SITE_OPENING } from "./index-copy";
import { demoteHeadings } from "./text";
import { mdBody, mdBulletList, mdDocument, mdHeading, mdIndexEntry, mdTitledSection } from "./blocks";

export const buildLlmsFullTxt = ({ pageTitles, experienceList, educationList }: TwinData) => {
  const documents = allEntries(experienceList);

  return mdDocument([
    ...SITE_OPENING,
    "Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with its canonical HTML URL after \"Source:\", its Markdown twin after \"Markdown:\", and ends with the twin verbatim. Cite the canonical HTML URL, not this file.",
    ABOUT_SECTION,
    mdTitledSection(
      "Table of Contents",
      mdBulletList(Array.map(documents, ({ name, canonical, twinUrl }) => mdIndexEntry(name, canonical, twinUrl)))
    ),
    DISCOVERY_SECTION,
    // Embeds verbatim twins demoted by two heading levels for hierarchical indexing.
    ...Array.map(documents, ({ name, canonical, twinUrl, render }) =>
      mdBody([mdHeading(2, name), `Source: ${canonical}`, `Markdown: ${twinUrl}`, demoteHeadings(String.trimEnd(render({ pageTitles, experienceList, educationList })))])
    ),
    COMPANION_NOTES_SECTION,
  ]);
};

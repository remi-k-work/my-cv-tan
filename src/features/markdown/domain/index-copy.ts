// Shared copy and section builders for llms.txt and llms-full.txt.
import { Array, Record } from "effect";
import { CONTENT_SIGNAL, HOME_COUNTRY, HOME_COUNTRY_NAME, HOME_LOCALITY, HOME_TITLE, JOB_TITLE, KNOWS_ABOUT, PERSON_DESCRIPTION, ROBOTS_TXT_HREF, SITE_LANGUAGE_NAMES, SITE_NAME, SITE_URL, SITEMAP_HREF } from "@/features/meta/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/links";
import { absoluteUrl } from "@/features/meta/domain/url";
import { mdBody, mdBulletList, mdFact, mdHeading, mdLink, mdQuote, mdTitledSection } from "./blocks";
import { escapeMd } from "./text";

// Reuse guidance and format instructions for AI ingest systems.
const AI_NOTES = [
  `Reuse is permitted for search, AI input and AI training (\`Content-Signal: ${CONTENT_SIGNAL}\`).`,
  "Markdown responses follow the request's language preferences. Append `?lang=pl` to any `.md` URL to request Polish explicitly; English is the fallback when no supported preference is present.",
  "Every page has a machine-readable Markdown twin; fetch one linked `.md` page at a time, or the single-request full-content document for everything at once.",
  "Always cite the clean canonical HTML URL from each document's frontmatter (`canonical:`), not the `.md` URL.",
  "Structured data (JSON-LD) is embedded in every page head.",
  "Every twin states its headline facts as frontmatter (`title`, `description`, `type`, `lang`, `canonical`), so a document can be indexed without reading the body.",
] as const;

const SINGLE_REQUEST_NOTE = `The complete content of every page is also available in a single request: ${LLMS_FULL_TXT_INDEX.url}.`;

export const ABOUT_SECTION = mdTitledSection(
  "About",
  mdBody([
    "Self-taught web developer portfolio. Every page has a machine-readable Markdown twin.",
    mdBulletList([
      mdFact("Name", SITE_NAME),
      mdFact("Website", SITE_URL),
      mdFact("Role", `${JOB_TITLE} (self-taught)`),
      mdFact("Based in", `${HOME_LOCALITY}, ${HOME_COUNTRY_NAME} (${HOME_COUNTRY})`),
      mdFact("Site languages", Array.join(Record.values(SITE_LANGUAGE_NAMES), " and ")),
      mdFact("Focus", Array.join(KNOWS_ABOUT, ", ")),
    ]),
  ])
);

export const INDEX_NOTES_SECTION = mdTitledSection("Notes for AI systems", mdBulletList([...AI_NOTES, SINGLE_REQUEST_NOTE]));

export const COMPANION_NOTES_SECTION = mdTitledSection("Notes for AI systems", mdBulletList(AI_NOTES));

// Retrieval surface map linking discovery endpoints.
export const DISCOVERY_LINES: ReadonlyArray<string> = Array.map(
  [
    { name: LLMS_TXT_INDEX.name, summary: "this index", url: LLMS_TXT_INDEX.url },
    { name: LLMS_FULL_TXT_INDEX.name, summary: "the complete site in one document", url: LLMS_FULL_TXT_INDEX.url },
    { name: "robots.txt", summary: "crawl directives", url: absoluteUrl(ROBOTS_TXT_HREF) },
    { name: "sitemap.xml", summary: "sitemap", url: absoluteUrl(SITEMAP_HREF) },
  ] as const,
  ({ name, summary, url }) => `${mdLink(name, url)}: ${summary}.`
);

export const DISCOVERY_SECTION = mdTitledSection("Discovery", mdBulletList(DISCOVERY_LINES));

export const SITE_OPENING: ReadonlyArray<string> = [mdHeading(1, SITE_NAME), mdQuote(HOME_TITLE), escapeMd(PERSON_DESCRIPTION)];

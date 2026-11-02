// services, features, and other libraries
import { Array, Record } from "effect";

// constants
import { CONTENT_SIGNAL, HOME_COUNTRY, HOME_COUNTRY_NAME, HOME_LOCALITY, HOME_TITLE, JOB_TITLE, KNOWS_ABOUT, PERSON_DESCRIPTION, SITE_LANGUAGE_NAMES, SITE_NAME, SITE_URL } from "@/features/meta/domain/constants";
import { LLMS_FULL_TXT_INDEX } from "@/features/meta/domain/links";
import { mdBody, mdBulletList, mdFact, mdHeading, mdQuote, mdTitledSection } from "./blocks";
import { escapeMd } from "./text";

// --- The prose both AI indexes publish verbatim ---
// llms.txt and llms-full.txt are two entry points onto one site, so every claim they make about who
// the author is, how the content may be reused and where to fetch it is written here once. The
// catalogue of documents they cover lives in catalogue.ts, and the section lists that differ per
// index live in site-index.ts and full-content.ts.

// Reuse guidance, single-sourced between llms.txt and its full-content companion so the two
// documents can never disagree about how the site may be ingested or cited. The Content-Signal
// value here is the same string robots.txt and every response header publish.
const AI_NOTES = [
  // Quotes the shared Content-Signal constant, so a change to the policy in robots.txt (and the
  // response headers) is reflected here instead of silently drifting out of sync
  `Reuse is permitted for search, AI input and AI training (\`Content-Signal: ${CONTENT_SIGNAL}\`).`,
  "Markdown responses follow the request's language preferences. Append `?lang=pl` to any `.md` URL to request Polish explicitly; English is the fallback when no supported preference is present.",
  "Every page has a machine-readable Markdown twin; fetch one linked `.md` page at a time, or the single-request full-content document for everything at once.",
  "Always cite the clean canonical HTML URL from each document's frontmatter (`canonical:`), not the `.md` URL.",
  "Structured data (JSON-LD) is embedded in every page head.",
  // The twins carry their headline facts as frontmatter, so an indexer that never parses the body
  // prose can still classify and rank the document
  "Every twin states its headline facts as frontmatter (`title`, `description`, `type`, `lang`, `canonical`), so a document can be indexed without reading the body.",
] as const;

// The single-request pointer only llms.txt carries. llms-full.txt omits it: that document *is* the
// companion, and telling its reader to fetch the document they are already reading is noise an AI
// parser has to discard before it can cite anything.
const SINGLE_REQUEST_NOTE = `The complete content of every page is also available in a single request: ${LLMS_FULL_TXT_INDEX.url}.`;

// Dense factual claims first: AI systems cite what they can extract as unambiguous facts.
// Shared verbatim by both indexes, so a single-request ingestion carries the same key facts.
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

// Reuse guidance lands last so a single-request ingestion is self-describing without the reader
// having to also fetch llms.txt. The `companion` switch is the one difference between the two
// indexes, so it is the only branch here instead of a second copy of the whole section.
export const notesSection = (companion: boolean) => mdTitledSection("Notes for AI systems", mdBulletList(companion ? [...AI_NOTES, SINGLE_REQUEST_NOTE] : AI_NOTES));

// The opening blocks of an index, exported so both builders lead with the same identity.
//
// The bio runs through escapeMd because it is authored content landing in the document body, and
// the home twin renders the very same string that way (pages.ts passes copy.intro, which *is* this
// bio, through escapeMd). These two indexes were the one surface interpolating it raw: a block-
// scoped character the bio had never happened to carry was all that stood between a future edit
// and a list item or a blockquote an indexer would read as authored structure.
export const SITE_OPENING: ReadonlyArray<string> = [mdHeading(1, SITE_NAME), mdQuote(HOME_TITLE), escapeMd(PERSON_DESCRIPTION)];

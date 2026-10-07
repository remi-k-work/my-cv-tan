// services, features, and other libraries
import { Array, Option, pipe, Record } from "effect";
import { absoluteUrl, experiencePath } from "./helpers";

// types
import type { ExperienceList } from "@/features/experience/domain";

interface SitemapEntry {
  readonly loc: string;
  readonly changefreq: string;
  readonly priority: string;
}

// constants
import { SITE_URL } from "./constants";

// HTML canonical URLs only: Markdown twins (*.md) are deliberately excluded to avoid
// duplicate-content dilution; AI crawlers discover them via llms.txt and <link rel="alternate">.
const STATIC_URLS = [
  { loc: SITE_URL, changefreq: "monthly", priority: "1.0" },
  { loc: `${SITE_URL}/education`, changefreq: "monthly", priority: "0.8" },
  { loc: `${SITE_URL}/contact`, changefreq: "monthly", priority: "0.5" },
  { loc: `${SITE_URL}/my-cv.pdf`, changefreq: "monthly", priority: "0.4" },
  { loc: `${SITE_URL}/my-cv-pl.pdf`, changefreq: "monthly", priority: "0.4" },
  { loc: `${SITE_URL}/my-certificates.pdf`, changefreq: "monthly", priority: "0.4" },
] as const;

// Entity names for the five characters that must be escaped inside XML element text
const XML_ENTITY_NAMES: Record.ReadonlyRecord<string, string> = { "&": "amp", "<": "lt", ">": "gt", '"': "quot", "'": "apos" };

// Wraps each special character in an entity reference built from its name
const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => `&${Option.getOrElse(Record.get(XML_ENTITY_NAMES, character), () => character)};`);

const toXmlNode = (entry: SitemapEntry) =>
  `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <changefreq>${escapeXml(entry.changefreq)}</changefreq>\n    <priority>${escapeXml(entry.priority)}</priority>\n  </url>`;

const wrapWithUrlSet = (entries: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

// One <url> per experience detail page plus the static routes
export const buildSitemapXml = (experienceList: ExperienceList) =>
  pipe(
    experienceList,
    Array.map(({ slug }) => ({ loc: absoluteUrl(experiencePath(slug)), changefreq: "monthly", priority: "0.6" })),
    Array.prependAll(STATIC_URLS),
    Array.map(toXmlNode),
    Array.join("\n"),
    wrapWithUrlSet
  );

export const sitemapUnavailableResponse = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>', {
    status: 503,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, follow",
    },
  });

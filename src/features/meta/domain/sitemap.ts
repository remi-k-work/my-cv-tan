// services, features, and other libraries
import { Array, pipe, Record } from "effect";
import { absoluteUrl, experiencePath } from "./url";

// types
import type { ExperienceList } from "@/features/experience/domain";

interface SitemapEntry {
  readonly loc: string;
}

// constants
import { CACHE_CONTROL, SITE_URL } from "./constants";

// HTML canonical URLs only: Markdown twins (*.md) are deliberately excluded to avoid
// duplicate-content dilution; AI crawlers discover them via llms.txt and <link rel="alternate">
const STATIC_URLS = [
  // Must byte-for-byte equal the homepage canonical (SITE_URL + "/"), or sitemap and canonical signals disagree
  { loc: `${SITE_URL}/` },
  { loc: `${SITE_URL}/education` },
  { loc: `${SITE_URL}/contact` },
  { loc: `${SITE_URL}/my-cv.pdf` },
  { loc: `${SITE_URL}/my-cv-pl.pdf` },
  { loc: `${SITE_URL}/my-certificates.pdf` },
] as const;

// Entity references for the five characters that are special inside XML element text
const XML_ENTITIES: Record.ReadonlyRecord<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

// The match set is exactly the keys above, so every special character is replaced
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character]);

// Keep sitemap entries minimal; Google ignores priority and changefreq
const toXmlNode = (entry: SitemapEntry) => `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n  </url>`;

const wrapWithUrlSet = (entries: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

// One <url> per experience detail page plus the static routes
export const buildSitemapXml = (experienceList: ExperienceList) =>
  pipe(
    experienceList,
    Array.map(({ slug }) => ({ loc: absoluteUrl(experiencePath(slug)) })),
    Array.prependAll(STATIC_URLS),
    Array.map(toXmlNode),
    Array.join("\n"),
    wrapWithUrlSet
  );

// Cacheable success response: entries only change when the portfolio data changes; shares the twins' CDN policy
export const sitemapResponse = (xml: string) =>
  new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": CACHE_CONTROL } });

export const sitemapUnavailableResponse = () =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>', {
    status: 503,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, follow",
    },
  });

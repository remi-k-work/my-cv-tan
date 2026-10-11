// services, features, and other libraries
import { Array, pipe, Record } from "effect";
import { absoluteUrl, experiencePath } from "./url";

// types
import type { ExperienceList } from "@/features/experience/domain";

// constants
import { SITE_URL } from "./constants";

// Canonical HTML URLs only: the Markdown twins are deliberately excluded (they canonicalize
// to HTML, and sitemaps must not list non-canonical URLs); AI crawlers find them via llms.txt
// and the <link rel="alternate"> every page head emits
const STATIC_URLS = [
  // Byte-equal to the homepage canonical (SITE_URL + "/"), so sitemap and canonical signals agree
  `${SITE_URL}/`,
  `${SITE_URL}/education`,
  `${SITE_URL}/contact`,
  `${SITE_URL}/my-cv.pdf`,
  `${SITE_URL}/my-cv-pl.pdf`,
  `${SITE_URL}/my-certificates.pdf`,
] as const;

// Entity references for the five characters that are special inside XML element text;
// the ampersand stays a unicode escape so the entity literals remain unambiguous
const XML_ENTITIES: Record.ReadonlyRecord<string, string> = { "&": "\u0026amp;", "<": "\u0026lt;", ">": "\u0026gt;", '"': "\u0026quot;", "'": "\u0026apos;" };

// The match set is exactly the keys above, so every special character is replaced
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character]);

// Minimal entries: Google ignores priority and changefreq, and the data has no real modified dates
const urlNode = (loc: string) => `<url><loc>${escapeXml(loc)}</loc></url>`;

const wrapWithUrlSet = (entries: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

// One <url> per experience detail page, plus the static routes
export const buildSitemapXml = (experienceList: ExperienceList) =>
  pipe(
    experienceList,
    Array.map(({ slug }) => absoluteUrl(experiencePath(slug))),
    Array.appendAll(STATIC_URLS),
    Array.map(urlNode),
    Array.join("\n"),
    wrapWithUrlSet
  );

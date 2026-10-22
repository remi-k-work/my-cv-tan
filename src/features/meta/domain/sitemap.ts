// services, features, and other libraries
import { Array, pipe, Record } from "effect";
import { absoluteUrl, experiencePath } from "./url";

// types
import type { ExperienceList } from "@/features/experience/domain/models";

// constants
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "./constants";
import { STATIC_PAGES } from "./static-pages";

// Canonical HTML URLs only: markdown twins canonicalize to HTML and must not appear in sitemap.xml
// Static paths lead in declaration order with documents appended, ensuring homepage is the primary crawl entry
const STATIC_URLS = pipe(
  STATIC_PAGES,
  Record.keys,
  Array.map(absoluteUrl),
  Array.appendAll(Array.map([CV_EN_HREF, CV_PL_HREF, CERTIFICATES_HREF], absoluteUrl))
);

// XML entity substitution table preserving valid XML character encoding in <loc> elements
const XML_ENTITIES: Record.ReadonlyRecord<string, string> = {
  "&": "\u0026amp;",
  "<": "\u0026lt;",
  ">": "\u0026gt;",
  '"': "\u0026quot;",
  "'": "\u0026apos;",
};

// Escapes reserved XML characters so URL query parameters and encoded characters never corrupt the markup
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (char) => XML_ENTITIES[char]);

// Generates an individual XML <url> element without obsolete changefreq/priority tags (per Google guidelines)
const urlNode = (loc: string) => `<url><loc>${escapeXml(loc)}</loc></url>`;

// Wraps generated URL entries in standard sitemaps schema definition
const wrapWithUrlSet = (entries: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;

// Maps static pages followed by detail experiences into an XML document conforming to sitemaps.org 0.9
export const buildSitemapXml = (experienceList: ExperienceList) =>
  pipe(
    STATIC_URLS,
    Array.appendAll(Array.map(experienceList, ({ slug }) => absoluteUrl(experiencePath(slug)))),
    Array.map(urlNode),
    Array.join("\n"),
    wrapWithUrlSet
  );

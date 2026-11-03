// Sitemap XML document builder for search engine indexers.

// services, features, and other libraries
import { absoluteUrl, experiencePath } from "./url";

// constants
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "./constants";
import { STATIC_PATHS } from "./static-pages";

// Static page canonical URLs and downloadable PDFs.
const STATIC_URLS = [...STATIC_PATHS, CV_EN_HREF, CV_PL_HREF, CERTIFICATES_HREF].map(absoluteUrl);

const XML_ENTITIES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

// No lastmod is emitted: authored dates are display strings, not trustworthy modification times.
export const buildSitemapXml = (slugs: ReadonlyArray<string>) => {
  const locs = [...STATIC_URLS, ...slugs.map((slug) => absoluteUrl(experiencePath(slug)))];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locs.map((loc) => `<url><loc>${escapeXml(loc)}</loc></url>`),
    "</urlset>",
  ].join("\n");
};

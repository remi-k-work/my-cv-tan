// Sitemap XML document builder for search engine indexers.

// services, features, and other libraries
import { absoluteUrl, experiencePath } from "./url";

// types
type UrlEntry = { readonly loc: string; readonly lastmod?: string };
type SitemapUrl = { readonly slug: string; readonly lastmod?: string };

// constants
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "./constants";
import { STATIC_PATHS } from "./static-pages";

// Static page canonical URLs and downloadable PDFs.
const STATIC_URLS = [...STATIC_PATHS, CV_EN_HREF, CV_PL_HREF, CERTIFICATES_HREF].map(absoluteUrl);

const XML_ENTITIES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

const urlNode = ({ loc, lastmod }: UrlEntry) =>
  `<url><loc>${escapeXml(loc)}</loc>${lastmod === undefined ? "" : `<lastmod>${escapeXml(lastmod)}</lastmod>`}</url>`;

// Builds XML sitemap with static canonicals followed by detail URLs.
export const buildSitemapXml = (urls: ReadonlyArray<SitemapUrl>) => {
  const locs = [
    ...STATIC_URLS.map((loc) => ({ loc }) as const),
    ...urls.map(({ slug, lastmod }) => ({ loc: absoluteUrl(experiencePath(slug)), lastmod }) as const),
  ];

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...locs.map(urlNode), "</urlset>"].join(
    "\n"
  );
};

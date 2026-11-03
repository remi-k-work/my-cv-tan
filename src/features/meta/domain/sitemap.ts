// Sitemap XML document builder for search engine indexers.
import { Array } from "effect";

// constants
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "./constants";
import { STATIC_PATHS } from "./static-pages";
import { absoluteUrl, experiencePath } from "./url";

// Static page canonical URLs and downloadable PDFs.
const STATIC_URLS = Array.map([...STATIC_PATHS, CV_EN_HREF, CV_PL_HREF, CERTIFICATES_HREF], absoluteUrl);

const XML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

type UrlEntry = { readonly loc: string; readonly lastmod?: string };

const urlNode = ({ loc, lastmod }: UrlEntry) =>
  `<url><loc>${escapeXml(loc)}</loc>${lastmod === undefined ? "" : `<lastmod>${escapeXml(lastmod)}</lastmod>`}</url>`;

type SitemapUrl = { readonly slug: string; readonly lastmod?: string };

// Builds XML sitemap with static canonicals followed by detail URLs.
export const buildSitemapXml = (urls: ReadonlyArray<SitemapUrl>) => {
  const locs = [
    ...Array.map(STATIC_URLS, (loc) => ({ loc } as const)),
    ...Array.map(urls, ({ slug, lastmod }) => ({ loc: absoluteUrl(experiencePath(slug)), lastmod } as const)),
  ];

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...Array.map(locs, urlNode), "</urlset>"].join("\n");
};

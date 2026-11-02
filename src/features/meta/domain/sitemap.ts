// services, features, and other libraries
import { Array } from "effect";

// constants
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "./constants";
import { STATIC_PATHS } from "./static-pages";
import { absoluteUrl, experiencePath } from "./url";

// Canonical HTML URLs only: markdown twins canonicalize to HTML and must not appear in sitemap.xml.
// Static paths lead in declaration order with the download documents appended, so the homepage stays
// the primary crawl entry.
export const STATIC_URLS = Array.map([...STATIC_PATHS, CV_EN_HREF, CV_PL_HREF, CERTIFICATES_HREF], absoluteUrl);

// Escaping table for the five XML predefined entities: a slug carrying &, <, > or a quote would
// otherwise corrupt the <loc> markup (or inject an element into the document)
const XML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

// Every character the class matches has a mapping, so the fallback is unreachable; it only keeps
// the lookup total under noUncheckedIndexedAccess
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

// One <url> entry. changefreq/priority are omitted: both are ignored by Google and were deprecated
// in the sitemaps protocol. lastmod is optional — when present it tells crawlers when the URL last
// changed, which is a freshness signal for AI overviews and search.
type UrlEntry = { readonly loc: string; readonly lastmod?: string };
const urlNode = ({ loc, lastmod }: UrlEntry) =>
  `<url><loc>${escapeXml(loc)}</loc>${lastmod === undefined ? "" : `<lastmod>${escapeXml(lastmod)}</lastmod>`}</url>`;

// A sitemap URL entry: the canonical slug and an optional last-modification timestamp. All callers
// pass objects; the plain-string overload was removed because every entry now carries a slug.
export type SitemapUrl = { readonly slug: string; readonly lastmod?: string };

// buildSitemapXml: static canonicals first (homepage primary), then deduplicated detail URLs by slug.
// No hreflang alternates: HTML pages are language-negotiated from one URL, so listing the same <loc>
// under two languages would claim two documents where there is one.
export const buildSitemapXml = (urls: ReadonlyArray<SitemapUrl>) => {
  const locs = [
    ...Array.map(STATIC_URLS, (loc) => ({ loc } as const)),
    ...Array.map(urls, ({ slug, lastmod }) => ({ loc: absoluteUrl(experiencePath(slug)), lastmod } as const)),
  ];

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...Array.map(locs, urlNode), "</urlset>"].join("\n");
};

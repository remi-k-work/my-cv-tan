// The sitemap.xml body, beside the robots.txt body in ./robots: both are generated documents. The
// declarations the body resolves against — the static pages and the downloadable documents every
// discovery surface advertises — live in ./pages and ./discovery, the module every other discovery
// path is read from, so a page or a download added there is listed without a second place to edit.

// domain
import { DOWNLOADABLE_DOCUMENT_PATHS } from "./discovery";
import { STATIC_PAGE_PATHS } from "./pages";
import { absoluteUrl, experiencePath } from "./urls";

// Static pages come from the shared catalogue; downloads are exactly the advertised documents,
// so a page or a download added to either is advertised here without a third list to keep in step.
const STATIC_URLS = [...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENT_PATHS].map((path) => absoluteUrl(path));

const XML_ENTITIES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

// The character class only ever matches the five predefined entities, so the pass-through arm is
// unreachable today; reading the lookup as optional keeps it honest rather than resting on the
// regex and this table having to agree by hand.
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

// A sitemap lists canonical site URLs only — the HTML pages plus the downloadable documents the
// rest of the site advertises — and never the Markdown twins. Experience slugs arrive already
// encoded the one way the canonicals and the twins encode them, so the surfaces name one address
// per page. No lastmod is emitted: authored dates are display strings, not trustworthy modification
// times.
export const buildSitemapXml = (slugs: ReadonlyArray<string>) => {
  const locs = new Set([...STATIC_URLS, ...slugs.map((slug) => absoluteUrl(experiencePath(slug)))]);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from(locs, (loc) => `<url><loc>${escapeXml(loc)}</loc></url>`),
    "</urlset>",
  ].join("\n");
};

// 503 fallback body served when experience slugs cannot be loaded.
export const SITEMAP_UNAVAILABLE_XML = '<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>';

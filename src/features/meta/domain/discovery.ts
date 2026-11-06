// Discovery document content (robots.txt and sitemap.xml) as plain strings.
// Purely generative: response envelopes and route handlers live in ../services/responses and
// ../services/handlers.

// constants
import { CONTENT_SIGNAL, CRAWL_DELAY, DOWNLOADABLE_DOCUMENTS, LLMS_TXT_HREF, SITEMAP_HREF } from "./constants";
import { STATIC_PAGE_PATHS } from "./pages";
import { absoluteUrl, experiencePath } from "./urls";

// --- robots.txt ---

const CONTENT_DIRECTIVES = ["Allow: /", "Allow: /*.md", "Disallow: /api", `Content-Signal: ${CONTENT_SIGNAL}`, `Crawl-delay: ${CRAWL_DELAY}`] as const;

export const ROBOTS_TXT = [
  "# The same public-content and reuse policy applies to current and future crawlers",
  "User-agent: *",
  ...CONTENT_DIRECTIVES,
  "",
  `# See ${LLMS_TXT_HREF} for the Markdown page index`,
  `Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
  "",
].join("\n");

// --- sitemap.xml ---

// Static pages come from the shared catalogue; downloads are exactly the advertised documents.
const STATIC_URLS = [...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENTS.map(({ href }) => href)].map((path) => absoluteUrl(path));
const XML_ENTITIES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => XML_ENTITIES[character] ?? character);

// No lastmod is emitted: authored dates are display strings, not trustworthy modification times.
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

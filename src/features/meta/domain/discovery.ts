// Crawler and AI discovery: robots.txt, sitemap XML, and the link declarations for
// every machine-readable document (robots.txt, sitemap.xml, llms.txt, llms-full.txt).

// services, features, and other libraries
import { absoluteUrl, experiencePath, joinLinkHeader } from "./helpers";
import { STATIC_PAGE_PATHS } from "./static-pages";

// types
import type { LinkTag } from "./models";

// constants
import {
  CERTIFICATES_HREF,
  CONTENT_SIGNAL,
  CRAWL_DELAY,
  CV_EN_HREF,
  CV_PL_HREF,
  LLMS_FULL_TXT_HREF,
  LLMS_TXT_HREF,
  SITEMAP_HREF,
} from "./constants";

const AI_SEARCH_CRAWLERS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "YouBot", "DuckAssistBot"] as const;
const AI_USER_CRAWLERS = ["ChatGPT-User", "Claude-User", "Perplexity-User", "Meta-ExternalFetcher", "MistralAI-User"] as const;
const AI_DATASET_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "DeepSeekBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Meta-ExternalAgent",
  "AI2Bot",
  "cohere-training-data-crawler",
  "Bytespider",
  "Timpibot",
  "ImagesiftBot",
] as const;

const CONTENT_DIRECTIVES = [
  "Allow: /",
  "Allow: /*.md",
  "Disallow: /api",
  `Content-Signal: ${CONTENT_SIGNAL}`,
  `Crawl-delay: ${CRAWL_DELAY}`,
] as const;

const crawlerGroup = (comment: string, bots: ReadonlyArray<string>) =>
  bots.flatMap((bot) => [`# ${comment}`, `User-agent: ${bot}`, ...CONTENT_DIRECTIVES, ""]);

export const ROBOTS_TXT = [
  ...crawlerGroup("Every crawler: the HTML pages and their Markdown twins", ["*"]),
  ...crawlerGroup("Explicitly allow AI search crawlers on HTML and Markdown twins", AI_SEARCH_CRAWLERS),
  ...crawlerGroup("User-initiated AI browsing is also allowed", AI_USER_CRAWLERS),
  ...crawlerGroup("Training and dataset crawlers are also currently allowed", AI_DATASET_CRAWLERS),
  "# See /llms.txt for the Markdown page index",
  `Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
  "",
].join("\n");

const STATIC_URLS = [...STATIC_PAGE_PATHS, CV_EN_HREF, CV_PL_HREF, CERTIFICATES_HREF].map(absoluteUrl);
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

// --- Discovery link declarations ---

export const SITEMAP_LINK: LinkTag = { rel: "sitemap", href: absoluteUrl(SITEMAP_HREF) };
export const LLMS_DISCOVERY_LINK: LinkTag = { rel: "llms", href: absoluteUrl(LLMS_TXT_HREF) };

// The AI index documents, declared once and projected into both the <head> and the Link header.
export const LLMS_TXT_INDEX = { name: "llms.txt", url: LLMS_DISCOVERY_LINK.href } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", url: absoluteUrl(LLMS_FULL_TXT_HREF) } as const;
export const AI_INDEXES = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;

export const AI_INDEX_LINKS: ReadonlyArray<LinkTag> = AI_INDEXES.map(({ name, url }) => ({
  rel: "alternate",
  type: "text/plain",
  title: name,
  href: url,
}));

export const AI_INDEX_LINK_HEADER = joinLinkHeader(AI_INDEX_LINKS);

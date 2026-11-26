// services, features, and other libraries
import { Array, String, pipe } from "effect";

// constants
import { CONTENT_SIGNAL, LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX, SITEMAP_INDEX } from "./discovery";

// The trailing slash blocks API routes without also blocking public slugs such as /api-portfolio
export const ROBOTS_DISALLOW_PATHS = ["/api/"] as const;

// Shared crawl policy predicate so robots.txt and sitemap.xml can never disagree on disallowed paths
export const isCrawlablePath = (path: string): boolean => !Array.some(ROBOTS_DISALLOW_PATHS, (prefix) => pipe(path, String.startsWith(prefix)));

export const ROBOTS_TXT = Array.join(
  [
    "# The same public-content and reuse policy applies to current and future crawlers",
    "User-agent: *",
    "Allow: /",
    ...Array.map(ROBOTS_DISALLOW_PATHS, (path) => `Disallow: ${path}`),
    `Content-Signal: ${CONTENT_SIGNAL}`,
    "",
    `# AI discovery: ${LLMS_TXT_INDEX.url} and ${LLMS_FULL_TXT_INDEX.url}`,
    `Sitemap: ${SITEMAP_INDEX.url}`,
    "",
  ],
  "\n"
);

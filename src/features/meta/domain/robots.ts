// services, features, and other libraries
import { Array } from "effect";

// constants
import { CONTENT_SIGNAL, LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX, SITEMAP_INDEX } from "./discovery";

// The trailing slash blocks API routes without also blocking public slugs such as /api-portfolio
export const ROBOTS_DISALLOW_PATHS = ["/api/"] as const;

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

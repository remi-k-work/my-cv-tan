// services, features, and other libraries
import { absoluteUrl } from "./urls";

// constants
import { CONTENT_SIGNAL, LLMS_TXT_HREF, SITEMAP_HREF } from "./constants";

const CRAWL_DELAY = "10";

export const ROBOTS_TXT = [
  "# The same public-content and reuse policy applies to current and future crawlers",
  "User-agent: *",
  "Allow: /",
  "Disallow: /api",
  `Content-Signal: ${CONTENT_SIGNAL}`,
  `Crawl-delay: ${CRAWL_DELAY}`,
  "",
  `# See ${LLMS_TXT_HREF} for the Markdown page index`,
  `Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
  "",
].join("\n");

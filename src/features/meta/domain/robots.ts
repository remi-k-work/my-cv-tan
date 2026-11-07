// The robots.txt body, beside the other generated document body (./sitemap). The declarations
// this body resolves against — the discovery paths, the reuse signal and the crawl pacing — live
// in ./discovery, so a path or a policy change lands here without a second place to edit.

// domain
import { CONTENT_SIGNAL, LLMS_TXT_HREF, SITEMAP_HREF } from "./discovery";
import { absoluteUrl } from "./urls";

// --- Crawl pacing ---

// Request delay for training bots.
const CRAWL_DELAY = "10";

// --- robots.txt ---

// A single wildcard group keeps this policy current for crawlers added after this file was written:
// the same public-content and reuse policy applies to all of them, including future ones.
export const ROBOTS_TXT = [
  "# The same public-content and reuse policy applies to current and future crawlers",
  "User-agent: *",
  "Allow: /",
  // The Markdown twins are the crawlable GEO surface, so they are allowed alongside the HTML
  "Allow: /*.md",
  // Form/RPC endpoints are not content, so they stay out of crawl budgets
  "Disallow: /api",
  `Content-Signal: ${CONTENT_SIGNAL}`,
  `Crawl-delay: ${CRAWL_DELAY}`,
  "",
  `# See ${LLMS_TXT_HREF} for the Markdown page index`,
  `Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
  "",
].join("\n");

// services, features, and other libraries
import { Array, Effect } from "effect";
import { documentRoute } from "@/lib/server-route";
import { absoluteUrl } from "./urls";
import { txtResponse } from "./responses";

// constants
import { CONTENT_SIGNAL, LLMS_TXT_HREF, SITEMAP_HREF } from "./discovery";

const CRAWL_DELAY = "10";

export const ROBOTS_TXT = Array.join(
  [
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
  ],
  "\n"
);

export const robotsHandler = documentRoute(() => Effect.succeed(txtResponse(ROBOTS_TXT)));

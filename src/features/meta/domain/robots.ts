// services, features, and other libraries
import { Array } from "effect";

// constants
import { CONTENT_SIGNAL, CRAWL_DELAY, SITEMAP_HREF } from "./constants";
import { absoluteUrl } from "./url";

// AI search engines with live web retrieval capabilities
const AI_SEARCH_CRAWLERS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "YouBot", "DuckAssistBot"] as const;

// User-directed chat assistants fetching links on demand
const AI_USER_CRAWLERS = ["ChatGPT-User", "Claude-User", "Perplexity-User", "Meta-ExternalFetcher", "MistralAI-User"] as const;

// Foundation model training and knowledge base ingest crawlers
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

// RFC 9309: named User-agent groups override '*', so every group must restate the same directives —
// including the Markdown-twin allow rule — or the allow lines would be lost. One table means a
// directive reaches the '*' group and every named group, or neither of them.
//
// The separator is the blank line after each bot's directives: without it two `User-agent` groups
// merge into a single record and every bot after the first inherits only the directives of the first.
// Form and RPC endpoints stay out of crawler budgets — they are not content.
//
// Crawl-delay is declared once per group so every named bot inherits the pacing alongside the
// allow/disallow directives.
const CONTENT_DIRECTIVES = [
  "Allow: /",
  "Allow: /*.md",
  "Disallow: /api",
  `Content-Signal: ${CONTENT_SIGNAL}`,
  `Crawl-delay: ${CRAWL_DELAY}`,
] as const;

// One comment plus one directive block per named bot, in output order — so the document a crawler
// reads is the array literal right here.
const group = (comment: string, bots: ReadonlyArray<string>) =>
  Array.flatMap(bots, (bot) => [`# ${comment}`, `User-agent: ${bot}`, ...CONTENT_DIRECTIVES, ""]);

// Assembles static robots.txt directives exposing both HTML and .md twins to search and generative
// engines. The '*' group is built by the same `group` as the named groups, so the groups cannot
// disagree about what is crawlable.
//
// The AI indexes are NOT named here: robots.txt has no directive that means "also read this
// document", and a `#` comment is prose no parser acts on. They travel on the Link response
// header instead (see txtResponse in response.ts), which is the mechanism a crawler can act on.
export const ROBOTS_TXT = Array.join(
  [
    ...group("Every crawler: the HTML pages and their Markdown twins", ["*"]),
    ...group("Explicitly allow AI search crawlers on HTML and Markdown twins", AI_SEARCH_CRAWLERS),
    ...group("User-initiated AI browsing is also allowed", AI_USER_CRAWLERS),
    ...group("Training and dataset crawlers are also currently allowed", AI_DATASET_CRAWLERS),
    "# See /llms.txt for the Markdown page index",
    // The sitemap directive resolves through the shared path constant and absoluteUrl, so the
    // robots.txt directive names exactly the file the /sitemap.xml route serves.
    //
    // A text document ends with a line terminator, so the last directive is a complete line.
    `Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
    "",
  ],
  "\n"
);

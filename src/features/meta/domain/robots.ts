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

// Crawl directives shared by all bot groups per RFC 9309.
const CONTENT_DIRECTIVES = [
  "Allow: /",
  "Allow: /*.md",
  "Disallow: /api",
  `Content-Signal: ${CONTENT_SIGNAL}`,
  `Crawl-delay: ${CRAWL_DELAY}`,
] as const;

// Generates a commented directive block terminated by an empty line per bot.
const group = (comment: string, bots: ReadonlyArray<string>) =>
  Array.flatMap(bots, (bot) => [`# ${comment}`, `User-agent: ${bot}`, ...CONTENT_DIRECTIVES, ""]);

// Complete robots.txt file exposing HTML, Markdown twins, and sitemap.
export const ROBOTS_TXT = Array.join(
  [
    ...group("Every crawler: the HTML pages and their Markdown twins", ["*"]),
    ...group("Explicitly allow AI search crawlers on HTML and Markdown twins", AI_SEARCH_CRAWLERS),
    ...group("User-initiated AI browsing is also allowed", AI_USER_CRAWLERS),
    ...group("Training and dataset crawlers are also currently allowed", AI_DATASET_CRAWLERS),
    "# See /llms.txt for the Markdown page index",
    `Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
    "",
  ],
  "\n"
);

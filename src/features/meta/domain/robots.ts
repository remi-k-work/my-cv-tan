// services, features, and other libraries
import { Array } from "effect";

// constants
import { SITE_URL } from "./constants";

// Search bots are separate from training crawlers; providers use different names for each purpose
const AI_SEARCH_CRAWLERS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "YouBot"] as const;
// Bots acting on a user's behalf inside chat products (fetching a link the user shared)
const AI_USER_CRAWLERS = ["ChatGPT-User", "Claude-User", "Perplexity-User", "Meta-ExternalFetcher", "MistralAI-User"] as const;
const AI_DATASET_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "AI2Bot",
  "cohere-training-data-crawler",
] as const;
const API_DISALLOW = "Disallow: /api";

// Specific bot groups override `*`, so repeat the API exclusion for each crawler
const botGroup = (bots: ReadonlyArray<string>) => Array.flatMap(bots, (bot) => [`User-agent: ${bot}`, "Allow: /", API_DISALLOW, ""]);

// Crawler directives: HTML and the machine-readable twins (*.md, llms.txt) are fully crawlable
export const buildRobotsTxt = () =>
  [
    "User-agent: *",
    "Allow: /",
    "Allow: /*.md",
    // Form/RPC endpoints are not content: the prefix rule keeps them out of crawl logs
    API_DISALLOW,
    "",
    "# Explicitly allow AI search crawlers on HTML and Markdown twins",
    ...botGroup(AI_SEARCH_CRAWLERS),
    "# User-initiated AI browsing is also allowed",
    ...botGroup(AI_USER_CRAWLERS),
    "# Training and dataset crawlers are also currently allowed",
    ...botGroup(AI_DATASET_CRAWLERS),
    "# Machine-readable indexes for AI systems",
    "# See /llms.txt for the Markdown page index",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

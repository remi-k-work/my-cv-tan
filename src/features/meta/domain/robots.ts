// services, features, and other libraries
import { Array } from "effect";

// constants
import { SITE_URL } from "./constants";

// Search bots are separate from training crawlers; providers use different names for each purpose
const AI_SEARCH_CRAWLERS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"] as const;
const AI_DATASET_CRAWLERS = ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended"] as const;

// Crawler directives: HTML and the machine-readable twins (*.md, llms.txt) are fully crawlable
export const buildRobotsTxt = () =>
  [
    "User-agent: *",
    "Allow: /",
    "Allow: /*.md",
    "",
    "# Explicitly allow AI search crawlers on HTML and Markdown twins",
    ...Array.flatMap(AI_SEARCH_CRAWLERS, (bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
    "# Training and dataset crawlers are also currently allowed",
    ...Array.flatMap(AI_DATASET_CRAWLERS, (bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
    "# Machine-readable indexes for AI systems",
    "# See /llms.txt for the Markdown page index",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

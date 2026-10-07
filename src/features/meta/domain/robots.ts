// services, features, and other libraries
import { Array } from "effect";

// constants
import { SITE_URL } from "./constants";

// AI search indexers and assistants the site explicitly welcomes; the wildcard
// group already allows all agents, so these are documentation signals only
const AI_CRAWLERS = ["GPTBot", "ClaudeBot", "PerplexityBot", "CCBot", "Google-Extended"] as const;

// Crawler directives: HTML and the machine-readable twins (*.md, llms.txt) are fully crawlable
export const buildRobotsTxt = () =>
  [
    "User-agent: *",
    "Allow: /",
    "Allow: /*.md",
    "",
    "# AI search indexers and assistants are welcome on HTML and Markdown twins",
    ...Array.flatMap(AI_CRAWLERS, (bot) => [`User-agent: ${bot}`, "Allow: /", ""]),
    "# Machine-readable indexes for AI systems",
    "# See /llms.txt for the Markdown page index",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

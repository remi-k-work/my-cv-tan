// services, features, and other libraries
import { Array, pipe } from "effect";

// constants
import { SITE_URL } from "./constants";

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

// Exclude form and RPC endpoints from crawler budgets
const API_DISALLOW = "Disallow: /api";

// Cloudflare CC0 content signal granting search, inference, and training rights
const CONTENT_SIGNAL = "Content-Signal: search=yes, ai-input=yes, ai-train=yes";

// RFC 9309: named User-agent groups override '*', so each group must restate allow/disallow and content signals
const botSection = (comment: string, bots: ReadonlyArray<string>) => [
  `# ${comment}`,
  ...Array.flatMap(bots, (bot) => [`User-agent: ${bot}`, "Allow: /", API_DISALLOW, CONTENT_SIGNAL, ""]),
];

// Assembles static robots.txt directives exposing both HTML and .md twins to search and generative engines
export const ROBOTS_TXT = pipe(
  [
    ["User-agent: *", "Allow: /", "Allow: /*.md", API_DISALLOW, CONTENT_SIGNAL, ""],
    botSection("Explicitly allow AI search crawlers on HTML and Markdown twins", AI_SEARCH_CRAWLERS),
    botSection("User-initiated AI browsing is also allowed", AI_USER_CRAWLERS),
    botSection("Training and dataset crawlers are also currently allowed", AI_DATASET_CRAWLERS),
    ["# See /llms.txt for the Markdown page index", `Sitemap: ${SITE_URL}/sitemap.xml`, ""],
  ],
  Array.flatten,
  Array.join("\n")
);

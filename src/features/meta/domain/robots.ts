// services, features, and other libraries
import { Array, pipe } from "effect";

// constants
import { SITE_URL } from "./constants";

// Search bots are separate from user-initiated fetchers and training crawlers; providers name each purpose differently
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

  // Less polite but still named dataset crawlers: ByteDance/TikTok, Timpi and The Image Sift
  "Bytespider",
  "Timpibot",
  "ImagesiftBot",
] as const;

// Form/RPC endpoints are not content: the prefix rule keeps them out of crawl budgets
const API_DISALLOW = "Disallow: /api";

// How accessed content may be reused (Cloudflare's CC0 proposal): all three uses allowed.
// Named groups override `*`, so each repeats both policies — a crawler reading only its
// own group must still see the API exclusion and the content signal
const CONTENT_SIGNAL = "Content-Signal: search=yes, ai-input=yes, ai-train=yes";

// A named crawler group for one purpose
const botSection = (comment: string, bots: ReadonlyArray<string>) => [
  `# ${comment}`,
  ...Array.flatMap(bots, (bot) => [`User-agent: ${bot}`, "Allow: /", API_DISALLOW, CONTENT_SIGNAL, ``]),
];

// Crawler directives: HTML and the machine-readable twins (*.md, llms.txt) are fully crawlable
// Fully static content, so it is computed once at module scope; routes only mint the per-request Response
export const ROBOTS_TXT = pipe(
  [
    ["User-agent: *", "Allow: /", "Allow: /*.md", API_DISALLOW, CONTENT_SIGNAL, ""],
    botSection("Explicitly allow AI search crawlers on HTML and Markdown twins", AI_SEARCH_CRAWLERS),
    botSection("User-initiated AI browsing is also allowed", AI_USER_CRAWLERS),
    botSection("Training and dataset crawlers are also currently allowed", AI_DATASET_CRAWLERS),
    [
      // Machine-readable indexes for AI systems
      "# See /llms.txt for the Markdown page index",
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      "",
    ],
  ],
  Array.flatten,
  Array.join("\n")
);

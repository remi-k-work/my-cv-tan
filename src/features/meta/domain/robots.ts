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

// A named crawler group; specific bot groups override `*`, so each repeats the API exclusion
const botSection = (comment: string, bots: ReadonlyArray<string>) => [
  `# ${comment}`,
  ...Array.flatMap(bots, (bot) => [`User-agent: ${bot}`, "Allow: /", API_DISALLOW, ``]),
];

// Crawler directives: HTML and the machine-readable twins (*.md, llms.txt) are fully crawlable
export const buildRobotsTxt = () =>
  pipe(
    [
      [
        "User-agent: *",
        "Allow: /",
        "Allow: /*.md",
        API_DISALLOW,
        // How accessed content may be reused (Cloudflare's CC0 proposal): crawlers that
        // ignore it still follow the groups below; the site allows all three uses
        "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
        "",
      ],
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

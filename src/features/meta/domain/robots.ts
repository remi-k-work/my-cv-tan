// constants
import { SITE_URL } from "./constants";

// Crawler directives; AI assistants are explicitly welcomed alongside the
// machine-readable indexes they prefer (llms.txt, .md twins).
export const buildRobotsTxt = () =>
  [
    "User-agent: *",
    "Allow: /",
    "Allow: /*.md",
    "",
    "# AI search indexers and assistants are welcome on HTML and Markdown twins",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: CCBot",
    "Allow: /",
    "",
    "# Machine-readable indexes for AI systems",
    "# See /llms.txt for the Markdown page index",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

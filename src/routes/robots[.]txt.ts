// tanstack
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = [
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
          "Sitemap: https://www.remiforge.dev/sitemap.xml",
          "",
        ].join("\n");
        return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});

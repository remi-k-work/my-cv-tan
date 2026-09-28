// tanstack
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = ["User-agent: *", "Allow: /", "Sitemap: https://www.remiforge.dev/sitemap.xml", ""].join("\n");
        return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});

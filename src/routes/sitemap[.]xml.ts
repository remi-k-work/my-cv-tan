// tanstack
import { createFileRoute } from "@tanstack/react-router";

// constants
const BASE_URL = "https://www.remiforge.dev";

function buildSitemap(): string {
  const eIds = [0, 1, 2, 3, 4, 5, 6, 7];
  const pIds = [0, 1, 2, 3, 4, 5, 6, 7];
  const today = new Date().toISOString().split("T")[0];

  const urls = [
    { loc: BASE_URL, changefreq: "monthly", priority: "1.0" },
    { loc: `${BASE_URL}/education`, changefreq: "monthly", priority: "0.8" },
    { loc: `${BASE_URL}/contact`, changefreq: "monthly", priority: "0.5" },
    { loc: `${BASE_URL}/my-cv.pdf`, changefreq: "monthly", priority: "0.4" },
    ...eIds.map((id) => ({ loc: `${BASE_URL}/exp/e/${id}`, changefreq: "monthly", priority: "0.6" })),
    ...pIds.map((id) => ({ loc: `${BASE_URL}/exp/p/${id}`, changefreq: "monthly", priority: "0.6" })),
  ];

  const entries = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(buildSitemap(), {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});

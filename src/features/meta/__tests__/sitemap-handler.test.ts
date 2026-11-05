// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { sitemapHandler } from "../services/http";
import { STATIC_PAGE_PATHS } from "../domain/pages";
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS } from "../domain/constants";
import { experiencePath } from "../domain/urls";

// assets
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";

// The sitemap handler is the discovery route wired end-to-end through the server runtime: it
// resolves each language's experience list from the real portfolio assets via the Datasets layer.
// The pure builder tests cannot see that wiring — a missing layer, a swapped language, or a
// dataless fallback would all still pass them — so this exercises the whole pipeline once.
it("sitemap route resolves the real portfolio assets into one canonical URL per page", async () => {
  const response = await sitemapHandler();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(response.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // The sitemap is crawlable but never a search result itself
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  // The shared discovery signal and AI-index advertisements ride along with the XML
  assert.strictEqual(response.headers.get("Content-Signal"), CONTENT_SIGNAL);
  assert.include(response.headers.get("Link") ?? "", "https://www.remiforge.dev/llms.txt");

  const xml = await response.text();

  // Every static page and downloadable document from the shared catalogue is advertised...
  for (const path of [...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENTS.map(({ href }) => href)]) {
    assert.include(xml, `<loc>https://www.remiforge.dev${path}</loc>`);
  }

  // ...and every experience slug resolved from the localized assets, deduplicated across languages.
  const slugs = new Set([...experienceEn, ...experiencePl].map(({ slug }) => slug));
  for (const slug of slugs) {
    const loc = `<loc>https://www.remiforge.dev${experiencePath(slug)}</loc>`;
    assert.strictEqual(xml.split(loc).length - 1, 1, `expected exactly one ${loc}`);
  }

  // A sitemap lists canonical HTML only, never the Markdown twins.
  assert.notInclude(xml, ".md");
});

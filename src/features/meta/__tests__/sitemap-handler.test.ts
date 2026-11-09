import { assert, it } from "@effect/vitest";
import { STATIC_PAGE_PATHS } from "../domain/pages";
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS } from "../domain/constants";
import { experiencePath } from "../domain/urls";
import { sitemapHandler } from "../domain/sitemap";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";

// Verifies end-to-end runtime wiring of the sitemap route using real portfolio assets.
it("sitemap route resolves the real portfolio assets into one canonical URL per page", async () => {
  const response = await sitemapHandler({ request: new Request("https://www.remiforge.dev/sitemap.xml") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(response.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // Crawlable but excluded from search indexes.
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  // Discovery signal and AI index Link header.
  assert.strictEqual(response.headers.get("Content-Signal"), CONTENT_SIGNAL);
  assert.include(response.headers.get("Link") ?? "", "https://www.remiforge.dev/llms.txt");

  const xml = await response.text();

  // Static pages and downloads.
  for (const path of [...STATIC_PAGE_PATHS, ...DOWNLOADABLE_DOCUMENTS.map(({ href }) => href)]) {
    assert.include(xml, `<loc>https://www.remiforge.dev${path}</loc>`);
  }

  // Deduplicated localized experience slugs.
  const slugs = new Set([...experienceEn, ...experiencePl].map(({ slug }) => slug));
  for (const slug of slugs) {
    const loc = `<loc>https://www.remiforge.dev${experiencePath(slug)}</loc>`;
    assert.strictEqual(xml.split(loc).length - 1, 1, `expected exactly one ${loc}`);
  }

  // Lists canonical HTML URLs only, not markdown twins.
  assert.notInclude(xml, ".md");
});

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { llmsFullTxtHandler, llmsTxtHandler } from "../services/handlers";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX, experiencePath } from "@/features/meta/domain/links";

// constants
import { CONTENT_SIGNAL } from "@/features/meta/domain/constants";

// assets
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";

// The llms.txt routes are the GEO retrieval surface wired end-to-end through the server runtime:
// they resolve the real portfolio assets via the Datasets layer, exactly as the sitemap handler
// test does for robots.txt and sitemap.xml. The pure builder tests cannot see that wiring — a
// missing layer, a swapped language, or a dataless fallback would all still pass them.
const slugs = new Set([...experienceEn, ...experiencePl].map(({ slug }) => slug));

it("llms.txt serves the real portfolio assets as the AI index with the full discovery header set", async () => {
  const response = await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  // Plain-text discovery documents are always English
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  // The reuse signal and the AI-index advertisements ride on every machine-readable response
  assert.strictEqual(response.headers.get("Content-Signal"), CONTENT_SIGNAL);
  assert.strictEqual(response.headers.get("Content-Location"), LLMS_TXT_INDEX.url);
  assert.include(response.headers.get("Link") ?? "", LLMS_FULL_TXT_INDEX.url);
  // The index is ingestion guidance, never a search result
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");

  const txt = await response.text();
  assert.include(txt, "# Remi Forge");
  // Every experience slug resolved from the localized assets is advertised by its canonical URL
  for (const slug of slugs) assert.include(txt, `](https://www.remiforge.dev${experiencePath(slug)})`);
  // The static twins are advertised with their language pin
  for (const twin of ["index.md?lang=en", "education.md?lang=en", "contact.md?lang=en"]) assert.include(txt, twin);
});

it("llms-full.txt concatenates one verbatim twin per real page behind its canonical URL", async () => {
  const response = await llmsFullTxtHandler({ request: new Request(LLMS_FULL_TXT_INDEX.url) });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(response.headers.get("Content-Location"), LLMS_FULL_TXT_INDEX.url);

  const txt = await response.text();
  // The three static pages plus every real experience, each introduced by its Source marker
  assert.strictEqual((txt.match(/^Source: /gm) ?? []).length, 3 + slugs.size);
  for (const slug of slugs) assert.include(txt, `Source: https://www.remiforge.dev${experiencePath(slug)}`);
});

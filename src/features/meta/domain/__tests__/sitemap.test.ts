import { assert, it } from "@effect/vitest";
import { STATIC_PAGE_PATHS } from "../pages";
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS } from "../discovery";
import { experiencePath } from "../urls";
import { sitemapHandler } from "../sitemap";
import { buildSitemapXml } from "../sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "../responses";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";

type Experience = { readonly slug: string };

const sampleExperience: Experience = {
  slug: "sample-role",
};

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

it("sitemap omits fabricated last-modification dates and leads with the canonical homepage", () => {
  const xml = buildSitemapXml([sampleExperience.slug]);
  assert.include(xml, "https://www.remiforge.dev/sample-role");
  assert.notInclude(xml, "<lastmod>");
  // Canonical homepage leads the sitemap document.
  assert.isTrue(xml.indexOf("<loc>https://www.remiforge.dev/</loc>") < xml.indexOf("<loc>https://www.remiforge.dev/sample-role</loc>"));
});

it("sitemap home URL equals the homepage canonical exactly", () => {
  const xml = buildSitemapXml([]);
  assert.include(xml, "<loc>https://www.remiforge.dev/</loc>");
  assert.notInclude(xml, "<loc>https://www.remiforge.dev</loc>");
});

it("sitemap includes every static page from the shared page catalogue", () => {
  const xml = buildSitemapXml([]);

  for (const path of STATIC_PAGE_PATHS) {
    assert.include(xml, `<loc>https://www.remiforge.dev${path}</loc>`);
  }
});

it("sitemap lists every advertised downloadable document", () => {
  const xml = buildSitemapXml([]);

  // Single-sourced downloadable documents catalogue.
  for (const { href } of DOWNLOADABLE_DOCUMENTS) {
    assert.include(xml, `<loc>https://www.remiforge.dev${href}</loc>`);
  }
});

it("sitemap lists canonical site URLs only — never the Markdown twins", () => {
  const xml = buildSitemapXml([sampleExperience.slug]);
  assert.notInclude(xml, ".md");
});

it("sitemap percent-encodes unsafe slug characters in generated URLs", () => {
  const xml = buildSitemapXml([`danger<&>"'`]);
  assert.include(xml, "https://www.remiforge.dev/danger%3C%26%3E%22&apos;");
  assert.notInclude(xml, "<loc>https://www.remiforge.dev/danger<&>");
});

it("sitemap encodes experience paths the same way canonical pages and twins do", () => {
  // Percent-encodes parentheses in experience paths for markdown and XML compatibility.
  const xml = buildSitemapXml(["role (senior) & more"]);
  assert.include(xml, "<loc>https://www.remiforge.dev/role%20%28senior%29%20%26%20more</loc>");
  assert.notInclude(xml, "role%20(senior)");
});

it("sitemap unions every supported language without emitting duplicate URLs", () => {
  const translatedOnly = { ...sampleExperience, slug: "translated-only" };
  const xml = buildSitemapXml([sampleExperience.slug, translatedOnly.slug]);

  assert.strictEqual((xml.match(/<loc>https:\/\/www\.remiforge\.dev\/sample-role<\/loc>/g) ?? []).length, 1);
  // Preserves insertion order during deduplication.
  assert.isTrue(xml.indexOf("<loc>https://www.remiforge.dev/translated-only</loc>") > xml.indexOf("<loc>https://www.remiforge.dev/sample-role</loc>"));
});

it("sitemap builder removes duplicate locations regardless of its caller", () => {
  const xml = buildSitemapXml([sampleExperience.slug, sampleExperience.slug, "education"]);

  assert.strictEqual((xml.match(/<loc>https:\/\/www\.remiforge\.dev\/sample-role<\/loc>/g) ?? []).length, 1);
  // Dedupes against static paths.
  assert.strictEqual((xml.match(/<loc>https:\/\/www\.remiforge\.dev\/education<\/loc>/g) ?? []).length, 1);
});

it("sitemap success responses carry the XML content type, noindex, and hour-long public caching", () => {
  const ok = sitemapResponse(buildSitemapXml([sampleExperience.slug]));
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(ok.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // Crawlable but excluded from search indexes.
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), "noindex, follow");
});

it("sitemap data failures return non-cacheable noindex XML with status 503", async () => {
  const response = sitemapUnavailableResponse();
  assert.strictEqual(response.status, 503);
  assert.strictEqual(response.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  // Transient data failure retry interval.
  assert.strictEqual(response.headers.get("Retry-After"), "300");
  assert.include(await response.text(), "<error>Sitemap is temporarily unavailable.</error>");
});

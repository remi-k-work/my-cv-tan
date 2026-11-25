import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { STATIC_PAGE_PATHS } from "../pages";
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS } from "../discovery";
import { experiencePath } from "../urls";
import { sitemapDocument, sitemapHandler } from "../../services/sitemap";
import { buildSitemapXml } from "../sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "@/features/meta/services/responses";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";
import { Datasets } from "@/features/data/services/datasets";
import { RequiredDataError } from "@/features/data/domain/required";
import { sampleExperience } from "./fixtures";

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
  assert.strictEqual(response.headers.get("X-Content-Type-Options"), "nosniff");
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
  const xml = buildSitemapXml([sampleExperience]);
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
  const xml = buildSitemapXml([sampleExperience]);
  assert.notInclude(xml, ".md");
});

it("sitemap publishes verified experience screenshots and omits pages without one", () => {
  const xml = buildSitemapXml([sampleExperience, { ...sampleExperience, slug: "without-image", imageName: "" }]);

  assert.include(xml, 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  assert.include(xml, "<image:loc>https://www.remiforge.dev/images/01-a.webp</image:loc>");
  assert.include(xml, "<image:title>Full-Stack Developer</image:title>");
  assert.strictEqual((xml.match(/<image:image>/g) ?? []).length, 1);
});

it("sitemap escapes image titles with the same XML boundary as URLs", () => {
  const xml = buildSitemapXml([{ ...sampleExperience, role: `<Role> & "Studio"` }]);

  assert.include(xml, "<image:title>&lt;Role&gt; &amp; &quot;Studio&quot;</image:title>");
});

it("sitemap percent-encodes unsafe slug characters in generated URLs", () => {
  const xml = buildSitemapXml([{ ...sampleExperience, slug: `danger<&>"'` }]);
  assert.include(xml, "https://www.remiforge.dev/danger%3C%26%3E%22&apos;");
  assert.notInclude(xml, "<loc>https://www.remiforge.dev/danger<&>");
});

it("sitemap encodes experience paths the same way canonical pages and twins do", () => {
  // Percent-encodes parentheses in experience paths for markdown and XML compatibility.
  const xml = buildSitemapXml([{ ...sampleExperience, slug: "role (senior) & more" }]);
  assert.include(xml, "<loc>https://www.remiforge.dev/role%20%28senior%29%20%26%20more</loc>");
  assert.notInclude(xml, "role%20(senior)");
});

it("sitemap preserves distinct slugs in caller order without emitting duplicate URLs", () => {
  const translatedOnly = { ...sampleExperience, slug: "translated-only" };
  const xml = buildSitemapXml([sampleExperience, translatedOnly]);

  assert.strictEqual((xml.match(/<loc>https:\/\/www\.remiforge\.dev\/sample-role<\/loc>/g) ?? []).length, 1);
  // Preserves insertion order during deduplication.
  assert.isTrue(xml.indexOf("<loc>https://www.remiforge.dev/translated-only</loc>") > xml.indexOf("<loc>https://www.remiforge.dev/sample-role</loc>"));
});

it("sitemap builder removes duplicate locations regardless of its caller", () => {
  const xml = buildSitemapXml([sampleExperience, sampleExperience, { ...sampleExperience, slug: "education" }]);

  assert.strictEqual((xml.match(/<loc>https:\/\/www\.remiforge\.dev\/sample-role<\/loc>/g) ?? []).length, 1);
  // Dedupes against static paths.
  assert.strictEqual((xml.match(/<loc>https:\/\/www\.remiforge\.dev\/education<\/loc>/g) ?? []).length, 1);
});

it("sitemap success responses carry the XML content type, noindex, and hour-long public caching", () => {
  const ok = sitemapResponse(buildSitemapXml([sampleExperience]));
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(ok.headers.get("Content-Location"), "https://www.remiforge.dev/sitemap.xml");
  assert.strictEqual(ok.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // Crawlable but excluded from search indexes.
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), "noindex, follow");
});

it.effect("the sitemap document reads the shared canonical slug set only from the default language", () =>
  Effect.gen(function* () {
    const reads: Array<string> = [];
    const response = yield* sitemapDocument.pipe(
      Effect.provideService(Datasets, {
        pageTitles: () => Effect.die("sitemap must not read page titles"),
        experienceList: (language) =>
          Effect.sync(() => {
            reads.push(language);
            return [];
          }),
        educationList: () => Effect.die("sitemap must not read education"),
      })
    );

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(reads, ["en"]);
  })
);

it.effect("the sitemap document recovers a dataset failure as a non-cacheable 503", () =>
  Effect.gen(function* () {
    const failed = Effect.fail(new RequiredDataError({ dataset: "experience list", message: "test outage" }));
    const response = yield* sitemapDocument.pipe(
      Effect.provideService(Datasets, {
        pageTitles: () => failed,
        experienceList: () => failed,
        educationList: () => failed,
      })
    );

    assert.strictEqual(response.status, 503);
    assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/sitemap.xml");
    assert.strictEqual(response.headers.get("Retry-After"), "300");
    assert.include(yield* Effect.promise(() => response.text()), "<error>Sitemap is temporarily unavailable.</error>");
  })
);

it("sitemap data failures return non-cacheable noindex XML with status 503", async () => {
  const response = sitemapUnavailableResponse();
  assert.strictEqual(response.status, 503);
  assert.strictEqual(response.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/sitemap.xml");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  // Transient data failure retry interval.
  assert.strictEqual(response.headers.get("Retry-After"), "300");
  assert.include(await response.text(), "<error>Sitemap is temporarily unavailable.</error>");
});

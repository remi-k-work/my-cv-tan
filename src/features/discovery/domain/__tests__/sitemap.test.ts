import { assert, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/domain/pages";
import { GLOBAL_SOCIAL_IMAGE } from "@/domain/site";
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS } from "@/domain/discovery";
import { experiencePath } from "@/domain/urls";
import { Sitemap } from "../../services/sitemap";
import { sitemapHandler } from "../../services/handlers";
import { buildSitemapXml } from "../sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "@/lib/http-response";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";
import { Datasets } from "@/features/data/services/datasets";
import { RequiredDataError } from "@/features/data/domain/required";
import { isCrawlablePath } from "../robots";

// types
import type { Experience } from "@/features/experience/domain/models";

// A portfolio-kind sample mirrors the shape the sitemap builder reads; kept local so the discovery
// suite stays independent of the other features' fixture modules.
const sampleExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
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

it("sitemap includes one negotiated canonical per static page and no language-specific duplicates", () => {
  const xml = buildSitemapXml([]);

  for (const path of STATIC_PAGE_PATHS) {
    const location = `<loc>https://www.remiforge.dev${path}</loc>`;
    assert.strictEqual(xml.split(location).length - 1, 1, `${path} must appear exactly once`);
  }
  // HTML locales share a canonical and vary by request; only Markdown twins use ?lang= pins.
  assert.notInclude(xml, "?lang=");
});

it("sitemap publishes the verified global social image for every static page", () => {
  const xml = buildSitemapXml([]);

  for (const path of STATIC_PAGE_PATHS) {
    const entry = xml.split(`<loc>https://www.remiforge.dev${path}</loc>`)[1]?.split("</url>")[0] ?? "";
    assert.include(entry, `<image:loc>${GLOBAL_SOCIAL_IMAGE.src}</image:loc>`, `${path} image`);
    const escapedTitle = STATIC_PAGES[path].copy.en.title.replaceAll("&", "&amp;");
    assert.include(entry, `<image:title>${escapedTitle}</image:title>`, `${path} image title`);
  }

  assert.strictEqual((xml.match(/<image:image>/g) ?? []).length, STATIC_PAGE_PATHS.length);
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

it("sitemap never advertises a crawl-disallowed URL", () => {
  const xml = buildSitemapXml([sampleExperience]);
  const paths = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => new URL(match[1]!).pathname);

  assert.isNotEmpty(paths);
  // Both crawl surfaces read one policy: a future disallowed page cannot slip into the sitemap unnoticed
  for (const path of paths) {
    assert.isTrue(isCrawlablePath(path), `${path} is disallowed by robots.txt`);
  }
});

it("sitemap publishes verified experience screenshots and omits pages without one", () => {
  const xml = buildSitemapXml([sampleExperience, { ...sampleExperience, slug: "without-image", imageName: "" }]);

  assert.include(xml, 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  assert.include(xml, "<image:loc>https://www.remiforge.dev/images/01-a.webp</image:loc>");
  assert.include(xml, "<image:title>Full-Stack Developer</image:title>");
  // One page-specific screenshot in addition to each static page's global share image
  assert.strictEqual((xml.match(/<image:image>/g) ?? []).length, STATIC_PAGE_PATHS.length + 1);
});

it("sitemap escapes image titles with the same XML boundary as URLs", () => {
  const xml = buildSitemapXml([{ ...sampleExperience, role: `<Role> & "Studio"` }]);

  assert.include(xml, "<image:title>&lt;Role&gt; &amp; &quot;Studio&quot;</image:title>");
});

it("sitemap drops XML-invalid controls without damaging valid Unicode", () => {
  const xml = buildSitemapXml([{ ...sampleExperience, role: "Bad\u0000\u000B Role 🚀" }]);

  assert.include(xml, "<image:title>Bad Role 🚀</image:title>");
  // oxlint-disable-next-line no-control-regex -- assert the same XML 1.0 character production as the serializer
  assert.notMatch(xml, /[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u);
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
  assert.strictEqual(ok.headers.get("Content-Language"), "en");
  assert.strictEqual(ok.headers.get("Content-Location"), "https://www.remiforge.dev/sitemap.xml");
  assert.strictEqual(ok.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // Crawlable but excluded from search indexes.
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), "noindex, follow");
});

it.effect("the sitemap document reads the shared canonical slug set only from the default language", () =>
  Effect.gen(function* () {
    const reads: Array<string> = [];
    const response = yield* Sitemap.use((sitemap) => sitemap.document).pipe(
      Effect.provide(
        Sitemap.layer.pipe(
          Layer.provide(
            Layer.succeed(Datasets, {
              pageTitles: () => Effect.die("sitemap must not read page titles"),
              experienceList: (language) =>
                Effect.sync(() => {
                  reads.push(language);
                  return [];
                }),
              educationList: () => Effect.die("sitemap must not read education"),
            })
          )
        )
      )
    );

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(reads, ["en"]);
  })
);

it.effect("the sitemap document recovers a dataset failure as a non-cacheable 503", () =>
  Effect.gen(function* () {
    const failed = Effect.fail(new RequiredDataError({ dataset: "experience list", message: "test outage" }));
    const response = yield* Sitemap.use((sitemap) => sitemap.document).pipe(
      Effect.provide(
        Sitemap.layer.pipe(
          Layer.provide(
            Layer.succeed(Datasets, {
              pageTitles: () => failed,
              experienceList: () => failed,
              educationList: () => failed,
            })
          )
        )
      )
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

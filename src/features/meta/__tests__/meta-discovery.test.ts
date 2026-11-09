import { assert, it } from "@effect/vitest";
import { ROBOTS_TXT } from "../domain/robots";
import { buildSitemapXml, robotsHandler } from "../domain/sitemap";
import { documentHeaders, sitemapResponse, sitemapUnavailableResponse, txtResponse } from "../domain/helpers";
import { STATIC_PAGE_PATHS } from "../domain/pages";
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS } from "../domain/constants";
import type { Experience } from "@/features/experience/domain/models";

const sampleExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  imageName: "01",
  skillsUsed: ["TypeScript"],
};

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

it("robots.txt allows content, disallows API endpoints, and advertises the sitemap", async () => {
  const robots = ROBOTS_TXT;
  assert.include(robots, "User-agent: *");
  assert.include(robots, "Allow: /");
  // Excludes private API endpoints from crawling.
  assert.include(robots, "Disallow: /api");
  assert.include(robots, "Sitemap: https://www.remiforge.dev/sitemap.xml");
  // Permissive content reuse signal.
  assert.include(robots, "Content-Signal: search=yes, ai-input=yes, ai-train=yes");
  // Global crawl delay.
  assert.include(robots, "Crawl-delay: 10");
  const userAgents = robots.match(/^User-agent: .*/gm) ?? [];
  assert.deepStrictEqual(userAgents, ["User-agent: *"]);
  assert.strictEqual((robots.match(/^Content-Signal: /gm) ?? []).length, userAgents.length);
  assert.strictEqual((robots.match(/^# [^\n]*\nUser-agent: /gm) ?? []).length, userAgents.length);
  assert.strictEqual((robots.match(/\n\n# /g) ?? []).length, userAgents.length);
  assert.isTrue(
    robots.endsWith("Sitemap: https://www.remiforge.dev/sitemap.xml\n"),
    "the sitemap directive is the document's last line and the file ends terminated"
  );

  const response = await robotsHandler({ request: new Request("https://www.remiforge.dev/robots.txt") });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  assert.isNull(response.headers.get("Content-Location"));
  assert.strictEqual(response.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // Advertises machine-readable AI indexes in Link header.
  assert.include(response.headers.get("Link") ?? "", "https://www.remiforge.dev/llms.txt");
  assert.include(response.headers.get("Link") ?? "", "https://www.remiforge.dev/llms-full.txt");

  // Verifies each handler call constructs a fresh, unconsumed Response.
  const first = await robotsHandler({ request: new Request("https://www.remiforge.dev/robots.txt") });
  const second = await robotsHandler({ request: new Request("https://www.remiforge.dev/robots.txt") });
  assert.notStrictEqual(first, second);
  assert.strictEqual(await first.text(), await second.text());
});

it("robots.txt responses are English, noindex, and carry the shared reuse signal", () => {
  const response = txtResponse("# Plain");
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(response.headers.get("Content-Language"), "en");
});

it("the HTML document names the request inputs it is language-negotiated from", () => {
  const polish = documentHeaders("pl");
  const english = documentHeaders("en");

  // Varies by Cookie and Accept-Language for proper CDN cache partitioning.
  assert.strictEqual(polish.Vary, "Cookie, Accept-Language");
  assert.strictEqual(polish["Content-Signal"], CONTENT_SIGNAL);
  assert.strictEqual(polish["Content-Language"], "pl");
  assert.strictEqual(english["Content-Language"], "en");
  assert.include(polish.Link, "https://www.remiforge.dev/llms.txt");
  assert.include(polish.Link, "https://www.remiforge.dev/llms-full.txt");
  assert.strictEqual(Object.keys(polish).length, 4);
  assert.deepStrictEqual(
    Object.keys(polish).filter((key) => key !== "Content-Language"),
    Object.keys(english).filter((key) => key !== "Content-Language")
  );
});

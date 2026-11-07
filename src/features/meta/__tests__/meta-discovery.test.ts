// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { ROBOTS_TXT } from "../domain/robots";
import { buildSitemapXml } from "../domain/sitemap";
import { documentHeaders } from "../services/headers";
import { robotsHandler } from "../services/handlers";
import { sitemapResponse, sitemapUnavailableResponse, txtResponse } from "../services/responses";
import { STATIC_PAGE_PATHS } from "../domain/pages";

// constants
import { CONTENT_SIGNAL, DOWNLOADABLE_DOCUMENTS } from "../domain/discovery";

// types
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
  // Soft crawl signal: static canonicals (homepage first) precede the detail pages
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

  // The sitemap reads the same catalogue the Markdown documents advertise, so a new download
  // cannot appear on one surface and go missing from the other.
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
  // Parentheses are raw after encodeURIComponent but must be percent-encoded in a URL that can
  // also be embedded in Markdown, so the sitemap shares the experiencePath helper.
  const xml = buildSitemapXml(["role (senior) & more"]);
  assert.include(xml, "<loc>https://www.remiforge.dev/role%20%28senior%29%20%26%20more</loc>");
  assert.notInclude(xml, "role%20(senior)");
});

it("sitemap unions every supported language without emitting duplicate URLs", () => {
  // Both locales resolve the same slug, plus an entry that exists only in a translated list
  const translatedOnly = { ...sampleExperience, slug: "translated-only" };
  const xml = buildSitemapXml([sampleExperience.slug, translatedOnly.slug]);

  assert.strictEqual((xml.match(/<loc>https:\/\/www\.remiforge\.dev\/sample-role<\/loc>/g) ?? []).length, 1);
  // Dedupe keeps first-seen order, so a translated-only entry lands after the source list
  assert.isTrue(xml.indexOf("<loc>https://www.remiforge.dev/translated-only</loc>") > xml.indexOf("<loc>https://www.remiforge.dev/sample-role</loc>"));
});

it("sitemap builder removes duplicate locations regardless of its caller", () => {
  const xml = buildSitemapXml([sampleExperience.slug, sampleExperience.slug, "education"]);

  assert.strictEqual((xml.match(/<loc>https:\/\/www\.remiforge\.dev\/sample-role<\/loc>/g) ?? []).length, 1);
  // Experience slugs can resolve to an existing static path; the sitemap still publishes one canonical URL.
  assert.strictEqual((xml.match(/<loc>https:\/\/www.remiforge\.dev\/education<\/loc>/g) ?? []).length, 1);
});

it("sitemap success responses carry the XML content type, noindex, and hour-long public caching", () => {
  const ok = sitemapResponse(buildSitemapXml([sampleExperience.slug]));
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(ok.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // The sitemap itself is not a search result, but must stay crawlable
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), "noindex, follow");
});

it("sitemap data failures return non-cacheable noindex XML with status 503", async () => {
  const response = sitemapUnavailableResponse();
  assert.strictEqual(response.status, 503);
  assert.strictEqual(response.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  // A temporary outage names when the crawler should retry, unlike a permanently missing resource
  assert.strictEqual(response.headers.get("Retry-After"), "300");
  // A crawler that reaches the failure still receives a well-formed XML document, not an empty body
  assert.include(await response.text(), "<error>Sitemap is temporarily unavailable.</error>");
});

// robots.txt is a static document, so its handler serves it synchronously; only the response body
// read at the end of this test is genuinely asynchronous
it("robots.txt allows content, disallows API endpoints, and advertises the sitemap", async () => {
  const robots = ROBOTS_TXT;
  assert.include(robots, "User-agent: *");
  assert.include(robots, "Allow: /");
  // Form/RPC endpoints are not content, so they stay out of crawl budgets
  assert.include(robots, "Disallow: /api");
  assert.include(robots, "Sitemap: https://www.remiforge.dev/sitemap.xml");
  // Content signals state how accessed content may be reused: all three uses allowed site-wide
  assert.include(robots, "Content-Signal: search=yes, ai-input=yes, ai-train=yes");
  // The wildcard group applies crawl pacing to every crawler.
  assert.include(robots, "Crawl-delay: 10");
  // A single wildcard group keeps this policy current for crawlers that are added after this file.
  const userAgents = robots.match(/^User-agent: .*/gm) ?? [];
  assert.deepStrictEqual(userAgents, ["User-agent: *"]);
  assert.strictEqual((robots.match(/^Content-Signal: /gm) ?? []).length, userAgents.length);
  assert.strictEqual((robots.match(/^# [^\n]*\nUser-agent: /gm) ?? []).length, userAgents.length);
  assert.strictEqual((robots.match(/\n\n# /g) ?? []).length, userAgents.length);
  assert.isTrue(
    robots.endsWith("Sitemap: https://www.remiforge.dev/sitemap.xml\n"),
    "the sitemap directive is the document's last line and the file ends terminated"
  );

  // The route serves the document through the meta service, so the response carries the shared
  // discovery headers (English, the reuse signal and the AI-index Link) the same way sitemap.xml
  // does beside its own content type
  const response = await robotsHandler({ request: new Request("https://www.remiforge.dev/robots.txt") });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  // robots.txt is one site-wide document, not a representation of a specific index URL, so the
  // optional Content-Location only the AI discovery indexes pass through stays absent
  assert.isNull(response.headers.get("Content-Location"));
  assert.strictEqual(response.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // robots.txt is the one document every crawler fetches, so it advertises the AI indexes from the
  // Link header as well: a parser acts on that, where the `# See /llms.txt` comment is human prose
  assert.include(response.headers.get("Link") ?? "", "https://www.remiforge.dev/llms.txt");
  assert.include(response.headers.get("Link") ?? "", "https://www.remiforge.dev/llms-full.txt");

  // A Response body is single-use, so a document held as a constant would hand the same consumed
  // body to every crawler. robots.txt is the document every bot fetches, so this is the one family
  // where the regression is guaranteed to be noticed.
  const first = await robotsHandler({ request: new Request("https://www.remiforge.dev/robots.txt") });
  const second = await robotsHandler({ request: new Request("https://www.remiforge.dev/robots.txt") });
  assert.notStrictEqual(first, second);
  assert.strictEqual(await first.text(), await second.text());
});

it("robots.txt responses are English, noindex, and carry the shared reuse signal", () => {
  const response = txtResponse("# Plain");
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  // robots.txt itself is not a search result
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  // The crawler instructions are always English
  assert.strictEqual(response.headers.get("Content-Language"), "en");
});

// The HTML document carries the same reuse signal and the same AI-index advertisements the twins,
// the indexes and robots.txt declare, so a crawler reading only the response headers never has to
// parse a body to learn the site's ingestion policy.
it("the HTML document names the request inputs it is language-negotiated from", () => {
  // The HTML language is resolved off the locale cookie and Accept-Language — the same two inputs
  // the twins' own Vary names — and GT writes that cookie on every response. Without the directive
  // a shared cache keys the document on the URL alone and hands whichever language it stored first
  // to every later visitor and every AI crawler, which a canonical tag cannot repair because the
  // two bodies genuinely differ.
  //
  // Content-Language is the HTTP-layer twin of <html lang> and of the JSON-LD inLanguage, so it
  // follows the negotiated locale rather than being a static constant.
  const polish = documentHeaders("pl");
  const english = documentHeaders("en");

  // Pinned against the two negotiation inputs themselves rather than the constant the builder
  // reads: comparing a value to its own source cannot fail, so it would not notice a third token
  // being added to (or dropped from) the list a shared cache keys the document on.
  assert.strictEqual(polish.Vary, "Cookie, Accept-Language");
  assert.strictEqual(polish["Content-Signal"], CONTENT_SIGNAL);
  assert.strictEqual(polish["Content-Language"], "pl");
  assert.strictEqual(english["Content-Language"], "en");
  // The AI indexes are advertised from the HTTP layer as well as every <head>
  assert.include(polish.Link, "https://www.remiforge.dev/llms.txt");
  assert.include(polish.Link, "https://www.remiforge.dev/llms-full.txt");
  // The root route is the only match that declares headers, and mergeHeaders sets rather than
  // appending, so nothing downstream can drop the Vary the negotiation depends on
  assert.strictEqual(Object.keys(polish).length, 4);
  // Only the language differs between two negotiations: the reuse signal, the advertisements and
  // the Vary are the same facts, so a Polish crawler and an English one read one policy
  assert.deepStrictEqual(
    Object.keys(polish).filter((key) => key !== "Content-Language"),
    Object.keys(english).filter((key) => key !== "Content-Language")
  );
});

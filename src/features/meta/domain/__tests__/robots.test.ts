import { assert, it } from "@effect/vitest";
import { ROBOTS_TXT } from "../robots";
import { robotsHandler } from "../sitemap";

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

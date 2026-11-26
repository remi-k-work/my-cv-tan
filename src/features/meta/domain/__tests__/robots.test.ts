import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { isCrawlablePath, ROBOTS_DISALLOW_PATHS, ROBOTS_TXT } from "../robots";
import { robotsHandler } from "../../services/handlers";
import { Robots } from "../../services/robots";

it("robots.txt allows content, disallows API endpoints, and advertises the sitemap", async () => {
  const robots = ROBOTS_TXT;
  assert.include(robots, "User-agent: *");
  assert.include(robots, "Allow: /");
  // Excludes API routes without matching public slugs that merely start with "api".
  const directives = robots.split("\n");
  assert.include(directives, "Disallow: /api/");
  assert.notInclude(directives, "Disallow: /api");
  assert.deepStrictEqual(
    directives.filter((line) => line.startsWith("Disallow: ")),
    ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`)
  );
  const disallowedPrefixes = directives.filter((line) => line.startsWith("Disallow: ")).map((line) => line.slice("Disallow: ".length));
  const isDisallowed = (path: string) => disallowedPrefixes.some((prefix) => path.startsWith(prefix));
  for (const path of ["/api/captcha", "/api/rpc/captcha", "/api/rpc/contact-me", "/api/rpc/data"]) {
    assert.isTrue(isDisallowed(path), `${path} must be excluded from crawling`);
    assert.isFalse(isCrawlablePath(path), `${path} must fail shared crawlability policy`);
  }
  for (const path of ["/api", "/api-portfolio", "/api.md"]) {
    assert.isFalse(isDisallowed(path), `${path} is a public slug, not an API endpoint`);
    assert.isTrue(isCrawlablePath(path), `${path} must pass shared crawlability policy`);
  }
  assert.include(robots, "Sitemap: https://www.remiforge.dev/sitemap.xml");
  // Permissive content reuse signal.
  assert.include(robots, "Content-Signal: search=yes, ai-input=yes, ai-train=yes");
  // Absolute discovery links remain actionable without resolving them against the request origin
  assert.include(robots, "# AI discovery: https://www.remiforge.dev/llms.txt and https://www.remiforge.dev/llms-full.txt");
  // Willing search and AI crawlers are not arbitrarily throttled by a non-standard delay.
  assert.notInclude(robots, "Crawl-delay");
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
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/robots.txt");
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

it.effect("Robots service builds fresh cacheable robots.txt responses", () =>
  Effect.gen(function* () {
    const first = yield* Robots.use((robots) => robots.document);
    const second = yield* Robots.use((robots) => robots.document);

    assert.notStrictEqual(first, second);
    assert.strictEqual(first.status, 200);
    assert.strictEqual(first.headers.get("Content-Location"), "https://www.remiforge.dev/robots.txt");
    assert.strictEqual(yield* Effect.promise(() => first.text()), ROBOTS_TXT);
  }).pipe(Effect.provide(Robots.layer))
);

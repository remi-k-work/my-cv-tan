import { assert, it } from "@effect/vitest";
import { INDEXABLE_ROBOTS } from "@/domain/http";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "@/features/meta/domain/urls";
import { CACHEABLE_HEADERS } from "@/features/meta/domain/constants";
import { contactHandler, educationHandler, experienceHandler, homeHandler, llmsFullTxtHandler, llmsTxtHandler } from "../services/handlers";
import { robotsHandler, sitemapHandler } from "@/features/meta/domain/sitemap";
import experienceEn from "@/assets/data/en/experience.json";

// Builds a language-pinned request URL.
const pinned = (path: string, lang: "en" | "pl") => new Request(`https://www.remiforge.dev${path}?lang=${lang}`);

// Extracts the canonical URI reference from RFC 8288 Link header.
const headerCanonical = (header: string | null) =>
  header
    ?.split(", ")
    .find((entry) => entry.includes(`rel="canonical"`))
    ?.match(/^<([^>]+)>/)?.[1];

const firstSlug = experienceEn[0]!.slug;

it("a served twin's response canonical names the very page its frontmatter cites", async () => {
  for (const [handler, path] of [
    [homeHandler, "/index.md"],
    [educationHandler, "/education.md"],
    [contactHandler, "/contact.md"],
  ] as const) {
    const response = await handler({ request: pinned(path, "en") });
    const canonical = headerCanonical(response.headers.get("Link"));

    assert.isDefined(canonical, `${path} advertised no canonical in its Link header`);
    assert.include(await response.text(), `canonical: ${JSON.stringify(canonical)}`);
  }

  const detail = await experienceHandler({ request: pinned(`/${encodeURIComponent(firstSlug)}.md`, "en") });
  const detailCanonical = headerCanonical(detail.headers.get("Link"));

  assert.strictEqual(detailCanonical, absoluteUrl(experiencePath(firstSlug)));
  assert.include(await detail.text(), `canonical: ${JSON.stringify(detailCanonical)}`);
});

it("the home twin serves the full indexable envelope behind the pinned language", async () => {
  const response = await homeHandler({ request: pinned("/index.md", "en") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  // Language pin selects the deterministic cache variant, stripping negotiation Vary.
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=en");
  assert.isNull(response.headers.get("Vary"));
  assert.strictEqual(response.headers.get("Cache-Control"), CACHEABLE_HEADERS["Cache-Control"]);
  assert.strictEqual(response.headers.get("X-Robots-Tag"), INDEXABLE_ROBOTS);

  const link = response.headers.get("Link") ?? "";
  assert.include(link, '<https://www.remiforge.dev/>; rel="canonical"');
  assert.include(link, "llms.txt");
  assert.include(link, "llms-full.txt");
  assert.include(link, 'rel="alternate"; type="text/markdown"; hreflang="pl"');

  const body = await response.text();
  assert.include(body, `canonical: "https://www.remiforge.dev/"`);
  assert.include(body, `title: "Remi Forge ● Web Developer in Rzeszów, Poland"`);
  assert.include(body, "## Experience");
  assert.include(body, "## Portfolio Projects");
  assert.strictEqual((body.match(/^# /gm) ?? []).length, 1);
});

it("the education twin resolves the school list dataset through the runtime", async () => {
  const response = await educationHandler({ request: pinned("/education.md", "en") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  const body = await response.text();
  assert.include(body, `canonical: "https://www.remiforge.dev/education"`);
  assert.include(body, "## Documents");
});

it("a pinned Polish request localizes the document envelope and its frontmatter", async () => {
  const response = await contactHandler({ request: pinned("/contact.md", "pl") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Language"), "pl");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/contact.md?lang=pl");

  const body = await response.text();
  assert.include(body, `lang: "pl"`);
  assert.include(body, `title: "Remi Forge ● Kontakt"`);
  assert.include(body, "## Kanały");
});

it("the experience twin renders the real page identity behind its canonical URL", async () => {
  const response = await experienceHandler({ request: pinned(`/${encodeURIComponent(firstSlug)}.md`, "en") });

  assert.strictEqual(response.status, 200);
  const body = await response.text();
  assert.include(body, `canonical: ${JSON.stringify(absoluteUrl(experiencePath(firstSlug)))}`);
  assert.strictEqual(response.headers.get("Content-Location"), `${absoluteUrl(experiencePath(firstSlug))}.md?lang=en`);
});

it("an unknown slug is a noindex 404 that still names the queried twin", async () => {
  const response = await experienceHandler({ request: pinned("/no-such-page.md", "en") });

  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/no-such-page.md?lang=en");
  assert.isNull(response.headers.get("Vary"));

  const body = await response.text();
  assert.include(body, "# Not Found");
  assert.include(body, "No page for slug");
  assert.include(body, "https://www.remiforge.dev/llms.txt");
});

it("paths the twin route cannot represent are 404s without a fabricated location", async () => {
  const nested = await experienceHandler({ request: pinned("/parent/child.md", "en") });
  assert.strictEqual(nested.status, 404);
  assert.isNull(nested.headers.get("Content-Location"));

  const malformed = await experienceHandler({ request: pinned("/%zz.md", "en") });
  assert.strictEqual(malformed.status, 404);
  assert.isNull(malformed.headers.get("Content-Location"));
});

it("the detail twin the home page links to is the document the detail route answers", async () => {
  const home = await (await homeHandler({ request: pinned("/index.md", "en") })).text();
  const slug = experienceEn[0]!.slug;
  const advertised = `${absoluteUrl(experienceMarkdownPath(slug))}?lang=en`;

  assert.include(home, advertised, "the home twin must advertise the detail twin a crawler can fetch");

  const detail = await experienceHandler({ request: pinned(`/${encodeURIComponent(slug)}.md`, "en") });

  assert.strictEqual(detail.status, 200);
  assert.include(await detail.text(), `canonical: ${JSON.stringify(absoluteUrl(experiencePath(slug)))}`);
  assert.strictEqual(detail.headers.get("Content-Location"), advertised);
});

it("every document route publishes the visitor-state policy its response needs", async () => {
  const pinnedRequest = (path: string) => new Request(`https://www.remiforge.dev${path}?lang=pl`);

  // Language-negotiated twins preserve visitor cookie unless explicitly pinned via ?lang=.
  for (const handler of [homeHandler, educationHandler, contactHandler, experienceHandler]) {
    assert.isTrue(handler.keepsVisitorState(new Request("https://www.remiforge.dev/index.md")));
    assert.isFalse(handler.keepsVisitorState(pinnedRequest("/index.md")));
  }

  // AI discovery indexes and crawl policies are language-independent and omit visitor cookies.
  for (const handler of [llmsTxtHandler, llmsFullTxtHandler]) {
    assert.isFalse(handler.keepsVisitorState(new Request("https://www.remiforge.dev/llms.txt")));
    assert.isFalse(handler.keepsVisitorState(pinnedRequest("/llms.txt")));
  }

  for (const handler of [robotsHandler, sitemapHandler]) {
    assert.isFalse(handler.keepsVisitorState(new Request("https://www.remiforge.dev/sitemap.xml")));
  }
});

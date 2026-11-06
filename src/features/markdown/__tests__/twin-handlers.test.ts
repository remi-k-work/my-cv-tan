// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { INDEXABLE_ROBOTS } from "@/domain/http";
import { absoluteUrl, experiencePath } from "@/features/meta/domain/urls";
import { CACHEABLE_HEADERS } from "@/features/meta/services/headers";

// handlers under test
import { contactHandler, educationHandler, experienceHandler, homeHandler, llmsFullTxtHandler, llmsTxtHandler } from "../services/handlers";

// the other machine-readable document routes share the same public-cache contract
import { robotsHandler, sitemapHandler } from "@/features/meta/services/handlers";

// assets
import experienceEn from "@/assets/data/en/experience.json";

// The twin routes are the site's core GEO surface, wired end-to-end through the server runtime
// exactly like the llms.txt and sitemap handlers (see those tests for why the pure builder tests
// cannot see the wiring). The handlers resolve the language off the request, render the localized
// twin through the real datasets and answer with the full document envelope, so this exercises
// the negotiation, rendering and response layers in one pass.
//
// Every request here carries an explicit `?lang=` pin: an unpinned request resolves its language
// through the GT request middleware's ambient scope, which only exists inside the framework
// runtime, while a pin is self-contained. The pinned path is also the one behavior the envelope
// unit tests cannot see: it must stay a single cacheable variant, so the negotiation Vary is
// dropped and the ambient cookie strip must never break the response.
const pinned = (path: string, lang: "en" | "pl") => new Request(`https://www.remiforge.dev${path}?lang=${lang}`);

// The Link header serializes one URI-reference per parameter group, so the canonical is the first
// `<...>` of the entry carrying `rel="canonical"`.
const headerCanonical = (header: string | null) =>
  header
    ?.split(", ")
    .find((entry) => entry.includes(`rel="canonical"`))
    ?.match(/^<([^>]+)>/)?.[1];

const firstSlug = experienceEn[0]!.slug;

it("a served twin's response canonical names the very page its frontmatter cites", async () => {
  // The HTTP envelope and the document body are two projections of one identity. A crawler reading
  // either one alone resolves a citation target, and the two spellings it could compare must agree:
  // this is the same invariant the experience-identity test pins for the HTML head, extended to the
  // twin's HTTP surface, where the canonical is a Link header rather than a <link> tag.
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

  // The detail twin agrees too, with its slug encoded the way every other surface encodes it
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
  // The pin IS the variant selector, so the response names itself without negotiating inputs
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=en");
  assert.isNull(response.headers.get("Vary"));
  assert.strictEqual(response.headers.get("Cache-Control"), CACHEABLE_HEADERS["Cache-Control"]);
  assert.strictEqual(response.headers.get("X-Robots-Tag"), INDEXABLE_ROBOTS);
  // The twin keeps advertising the whole retrieval surface from the HTTP layer alone
  const link = response.headers.get("Link") ?? "";
  assert.include(link, '<https://www.remiforge.dev/>; rel="canonical"');
  assert.include(link, "llms.txt");
  assert.include(link, "llms-full.txt");
  assert.include(link, 'rel="alternate"; type="text/markdown"; hreflang="pl"');

  const body = await response.text();
  // The twin's frontmatter cites the clean canonical HTML URL, and the document stays one
  // flat H1 with the experience sections the home page renders
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
  // A dataset-free failure would have been a 503, so reaching the body proves the
  // education list resolved from the real assets
  assert.include(body, "## Documents");
});

it("a pinned Polish request localizes the document envelope and its frontmatter", async () => {
  const response = await contactHandler({ request: pinned("/contact.md", "pl") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Language"), "pl");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/contact.md?lang=pl");

  const body = await response.text();
  // The twin copy follows the pin: the page's authored Polish identity, not the English source
  assert.include(body, `lang: "pl"`);
  assert.include(body, `title: "Remi Forge ● Kontakt"`);
});

it("the experience twin renders the real page identity behind its canonical URL", async () => {
  const response = await experienceHandler({ request: pinned(`/${encodeURIComponent(firstSlug)}.md`, "en") });

  assert.strictEqual(response.status, 200);
  const body = await response.text();
  assert.include(body, `canonical: ${JSON.stringify(absoluteUrl(experiencePath(firstSlug)))}`);
  // The twin route answers on the same path the home twin and llms.txt advertise
  assert.strictEqual(response.headers.get("Content-Location"), `${absoluteUrl(experiencePath(firstSlug))}.md?lang=en`);
});

it("an unknown slug is a noindex 404 that still names the queried twin", async () => {
  const response = await experienceHandler({ request: pinned("/no-such-page.md", "en") });

  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  // A failure never caches, and the twin URL the crawler asked for is named so the
  // AI index advertisement beside it is actionable
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/no-such-page.md?lang=en");
  // The 404 body is a real twin with the escape links, not an empty body
  const body = await response.text();
  assert.include(body, "# Not Found");
  assert.include(body, "No page for slug");
  assert.include(body, "https://www.remiforge.dev/llms.txt");
});

it("paths the twin route cannot represent are 404s without a fabricated location", async () => {
  // A nested path is not one slug segment; the route never resolves a document for it
  const nested = await experienceHandler({ request: pinned("/parent/child.md", "en") });
  assert.strictEqual(nested.status, 404);
  assert.isNull(nested.headers.get("Content-Location"));

  // Malformed percent-encoding degrades to the same clean 404 instead of throwing
  const malformed = await experienceHandler({ request: pinned("/%zz.md", "en") });
  assert.strictEqual(malformed.status, 404);
  assert.isNull(malformed.headers.get("Content-Location"));
});

// `removeResponseHeader` only has an effect inside the framework's response context, so the policy
// each route carries is the observable half of the public-cache contract a direct call can pin.
it("every document route publishes the visitor-state policy its response needs", async () => {
  const pinnedRequest = (path: string) => new Request(`https://www.remiforge.dev${path}?lang=pl`);

  // A language-negotiated twin's cookie is the reader's own until the URL pins the language for it.
  for (const handler of [homeHandler, educationHandler, contactHandler, experienceHandler]) {
    assert.isTrue(handler.keepsVisitorState(new Request("https://www.remiforge.dev/index.md")));
    assert.isFalse(handler.keepsVisitorState(pinnedRequest("/index.md")));
  }

  // The GEO indexes are one public, language-independent document: whatever the caller appends to
  // the path, no visitor-specific cookie may ride along. Reusing the twin policy here would keep
  // the negotiation cookie for a `?lang=` the document ignores and pin a visitor response in a
  // shared cache.
  for (const handler of [llmsTxtHandler, llmsFullTxtHandler]) {
    assert.isFalse(handler.keepsVisitorState(new Request("https://www.remiforge.dev/llms.txt")));
    assert.isFalse(handler.keepsVisitorState(pinnedRequest("/llms.txt")));
  }

  // robots.txt and sitemap.xml are the other two public, visitor-independent documents.
  for (const handler of [robotsHandler, sitemapHandler]) {
    assert.isFalse(handler.keepsVisitorState(new Request("https://www.remiforge.dev/sitemap.xml")));
  }
});

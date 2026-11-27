// The `<link>` vocabulary in src/domain/links.ts: the RFC 8288 serializer every HTML `<head>` and
// HTTP `Link:` header is written through, and the canonical/author/alternate and discovery builders
// that feed it. The root head's own use of these declarations is asserted from the meta feature.

import { assert, it } from "@effect/vitest";
import {
  AI_DISCOVERY_LINK_HEADER,
  AI_DISCOVERY_LINKS,
  aiDiscoveryLinkHeader,
  authorLink,
  canonicalLink,
  joinLinkHeader,
  languageVariantLinks,
  LLMS_DISCOVERY_LINK,
  representationLinks,
  SITEMAP_LINK,
} from "@/domain/links";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/domain/discovery";

// --- The Link header ---
// The HTML <head> and the HTTP Link header are two projections of one declaration. These tests pin
// the serialization the rest of the site depends on: parameter order, the URI-reference wrapper, and
// the fact that both surfaces advertise the same documents.

it("a link serializes as a URI-reference with its parameters in a fixed order", () => {
  assert.strictEqual(joinLinkHeader([{ rel: "canonical", href: "https://www.remiforge.dev/" }]), '<https://www.remiforge.dev/>; rel="canonical"');
  // The order is rel, type, title, hreflang whether or not the declaring literal listed them in it,
  // so two responses advertising the same links are byte-equal regardless of how each was written
  assert.strictEqual(
    joinLinkHeader([{ rel: "alternate", hrefLang: "en", type: "text/markdown", href: "https://www.remiforge.dev/index.md" }]),
    '<https://www.remiforge.dev/index.md>; rel="alternate"; type="text/markdown"; hreflang="en"'
  );
  assert.strictEqual(
    joinLinkHeader([{ rel: "alternate", type: "text/plain", title: "llms.txt", href: "https://www.remiforge.dev/llms.txt" }]),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt"'
  );
});

it("quoted Link parameters cannot escape their values", () => {
  assert.strictEqual(
    joinLinkHeader([{ rel: "alternate", href: "https://www.remiforge.dev/llms.txt", title: 'A "quoted" \\ title' }]),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; title="A \\"quoted\\" \\\\ title"'
  );
});

it("representation links share canonical, discovery and language ordering across HTML and HTTP", () => {
  const canonical = "https://www.remiforge.dev/";

  assert.deepStrictEqual(representationLinks(canonical, "/index.md", AI_DISCOVERY_LINKS), [
    canonicalLink(canonical),
    ...AI_DISCOVERY_LINKS,
    ...languageVariantLinks("/index.md"),
  ]);
});

it("language variants list every supported language and close with the x-default", () => {
  assert.deepStrictEqual(joinLinkHeader(languageVariantLinks("/index.md")).split(", "), [
    '<https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="en"',
    '<https://www.remiforge.dev/index.md?lang=pl>; rel="alternate"; type="text/markdown"; hreflang="pl"',
    // The unpinned URL negotiates unsupported preferences and falls back to English
    '<https://www.remiforge.dev/index.md>; rel="alternate"; type="text/markdown"; hreflang="x-default"',
  ]);
});

it("link builders name the canonical and author documents", () => {
  assert.deepStrictEqual(canonicalLink("https://www.remiforge.dev/education"), {
    rel: "canonical",
    href: "https://www.remiforge.dev/education",
  });
  assert.deepStrictEqual(authorLink("https://www.remiforge.dev/"), { rel: "author", href: "https://www.remiforge.dev/" });
});

it("the AI discovery links project into the head and Link header with spec-compliant relations", () => {
  assert.strictEqual(
    AI_DISCOVERY_LINK_HEADER,
    '<https://www.remiforge.dev/llms.txt>; rel="describedby", <https://www.remiforge.dev/llms-full.txt>; rel="related"; type="text/plain"; title="llms-full.txt"'
  );
  assert.strictEqual(AI_DISCOVERY_LINK_HEADER, joinLinkHeader(AI_DISCOVERY_LINKS));
});

it("discovery response headers omit the document currently being served", () => {
  assert.strictEqual(
    aiDiscoveryLinkHeader(LLMS_TXT_INDEX.url),
    '<https://www.remiforge.dev/llms-full.txt>; rel="related"; type="text/plain"; title="llms-full.txt"'
  );
  assert.strictEqual(
    aiDiscoveryLinkHeader(LLMS_FULL_TXT_INDEX.url),
    '<https://www.remiforge.dev/llms.txt>; rel="describedby"'
  );
});

it("discovery links declare the sitemap and the canonical llms index", () => {
  assert.deepStrictEqual(SITEMAP_LINK, { rel: "sitemap", href: "https://www.remiforge.dev/sitemap.xml" });
  assert.deepStrictEqual(LLMS_DISCOVERY_LINK, { rel: "describedby", href: "https://www.remiforge.dev/llms.txt" });
});

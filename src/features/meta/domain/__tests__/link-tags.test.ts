import { assert, it } from "@effect/vitest";
import {
  AI_DISCOVERY_LINK_HEADER,
  AI_DISCOVERY_LINKS,
  aiDiscoveryLinkHeader,
  LLMS_DISCOVERY_LINK,
  LLMS_FULL_TXT_INDEX,
  LLMS_TXT_INDEX,
  SITEMAP_LINK,
} from "../discovery";
import { ROOT_HEAD } from "../root-head";
import { authorLink, canonicalLink, joinLinkHeader, languageVariantLinks, representationLinks } from "../link-tags";
import type { LinkTag } from "../models";

// The three parameters the serializer writes, and nothing else: a link declaring a fourth would
// have it silently dropped, so the declaration and the emitted header would disagree.
const SERIALIZABLE_PARAMETERS = { type: "type", title: "title", hrefLang: "hreflang" } as const;

// Every link the site publishes, from every declaration that emits one: the site-wide root head,
// the AI-index advertisements, the twin language variants, and the page-level builders.
const publishedLinks: ReadonlyArray<LinkTag> = [
  ...ROOT_HEAD.links,
  ...languageVariantLinks("/index.md"),
  canonicalLink("https://www.remiforge.dev/education"),
  authorLink("https://www.remiforge.dev/"),
  SITEMAP_LINK,
  LLMS_DISCOVERY_LINK,
];

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

it("every link the site publishes carries only the three parameters the serializer knows", () => {
  // The parameter set is closed (type, title, hreflang). Anything else is a compile error at the
  // declaration, but this pins the runtime side of that contract across every emitting site: no
  // link the site publishes reaches a serializer that would drop the parameter silently.
  for (const link of publishedLinks) {
    for (const parameter of Object.keys(link)) {
      if (parameter === "href" || parameter === "rel") continue;
      assert.include(Object.keys(SERIALIZABLE_PARAMETERS), parameter, `${JSON.stringify(link)} declares an unknown parameter "${parameter}"`);
    }
  }

  // And the other direction: a parameter a link does declare survives onto the wire. Walking only
  // the closed set above cannot notice a builder that forgets to forward the value it was handed.
  for (const link of publishedLinks) {
    const header = joinLinkHeader([link]);

    for (const [property, parameter] of Object.entries(SERIALIZABLE_PARAMETERS)) {
      const value = link[property as keyof typeof SERIALIZABLE_PARAMETERS];
      if (value === undefined) {
        assert.notInclude(header, `${parameter}="`, `${JSON.stringify(link)} declares no ${property} but the header emits one`);
        continue;
      }
      assert.include(header, `${parameter}="${value}"`, `${JSON.stringify(link)} loses its ${property} in the header`);
    }
  }
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

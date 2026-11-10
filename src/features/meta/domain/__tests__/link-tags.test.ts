import { assert, it } from "@effect/vitest";
import { AI_INDEX_LINKS, AI_INDEX_LINK_HEADER, LLMS_DISCOVERY_LINK, SITEMAP_LINK } from "../discovery";
import { ROOT_HEAD } from "../root-head";
import { authorLink, canonicalLink, joinLinkHeader, languageVariantLinks, markdownAlternateLink } from "../link-tags";
import type { LinkTag } from "../models";

// The three parameters the serializer writes, and nothing else: a link declaring a fourth would
// have it silently dropped, so the declaration and the emitted header would disagree.
const SERIALIZABLE_PARAMETERS = ["type", "title", "hreflang"] as const;

// Every link the site publishes, from every declaration that emits one: the site-wide root head,
// the AI-index advertisements, the twin language variants, and the page-level builders.
const publishedLinks: ReadonlyArray<LinkTag> = [
  ...ROOT_HEAD.links,
  ...AI_INDEX_LINKS,
  ...languageVariantLinks("https://www.remiforge.dev/index.md"),
  canonicalLink("https://www.remiforge.dev/education"),
  authorLink("https://www.remiforge.dev/"),
  markdownAlternateLink("/index.md", "pl"),
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
    joinLinkHeader([{ rel: "alternate", hreflang: "en", type: "text/markdown", href: "https://www.remiforge.dev/index.md" }]),
    '<https://www.remiforge.dev/index.md>; rel="alternate"; type="text/markdown"; hreflang="en"'
  );
  assert.strictEqual(
    joinLinkHeader([{ rel: "alternate", type: "text/plain", title: "llms.txt", href: "https://www.remiforge.dev/llms.txt" }]),
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt"'
  );
});

it("language variants list every supported language and close with the x-default", () => {
  assert.deepStrictEqual(joinLinkHeader(languageVariantLinks("https://www.remiforge.dev/index.md")).split(", "), [
    '<https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="en"',
    '<https://www.remiforge.dev/index.md?lang=pl>; rel="alternate"; type="text/markdown"; hreflang="pl"',
    // The x-default is the English document, the site's source language
    '<https://www.remiforge.dev/index.md?lang=en>; rel="alternate"; type="text/markdown"; hreflang="x-default"',
  ]);
});

it("every link the site publishes carries only the three parameters the serializer knows", () => {
  // The parameter set is closed (type, title, hreflang). Anything else is a compile error at the
  // declaration, but this pins the runtime side of that contract across every emitting site: no
  // link the site publishes reaches a serializer that would drop the parameter silently.
  for (const link of publishedLinks) {
    for (const parameter of Object.keys(link)) {
      if (parameter === "href" || parameter === "rel") continue;
      assert.include(SERIALIZABLE_PARAMETERS, parameter, `${JSON.stringify(link)} declares an unknown parameter "${parameter}"`);
    }
  }

  // And the other direction: a parameter a link does declare survives onto the wire. Walking only
  // the closed set above cannot notice a builder that forgets to forward the value it was handed.
  for (const link of publishedLinks) {
    const header = joinLinkHeader([link]);

    for (const parameter of SERIALIZABLE_PARAMETERS) {
      const value = link[parameter];
      if (value === undefined) {
        assert.notInclude(header, `${parameter}="`, `${JSON.stringify(link)} declares no ${parameter} but the header emits one`);
        continue;
      }
      assert.include(header, `${parameter}="${value}"`, `${JSON.stringify(link)} loses its ${parameter} in the header`);
    }
  }
});

it("link builders name the canonical, author, and language-pinned Markdown twin", () => {
  assert.deepStrictEqual(canonicalLink("https://www.remiforge.dev/education"), {
    rel: "canonical",
    href: "https://www.remiforge.dev/education",
  });
  assert.deepStrictEqual(authorLink("https://www.remiforge.dev/"), { rel: "author", href: "https://www.remiforge.dev/" });
  // The HTML alternate is pinned to the negotiated language but deliberately carries no hreflang:
  // the HTML pages are one URL, so claiming distinct language documents would be false.
  assert.deepStrictEqual(markdownAlternateLink("/index.md", "pl"), {
    rel: "alternate",
    type: "text/markdown",
    href: "https://www.remiforge.dev/index.md?lang=pl",
  });
});

it("the AI indexes project into both the <head> advertisements and the Link header from one record", () => {
  // Same documents, both surfaces: a crawler that only parses response headers sees exactly what a
  // crawler that only parses the <head> sees.
  assert.deepStrictEqual(AI_INDEX_LINKS, [
    { rel: "alternate", type: "text/plain", title: "llms.txt", href: "https://www.remiforge.dev/llms.txt" },
    { rel: "alternate", type: "text/plain", title: "llms-full.txt", href: "https://www.remiforge.dev/llms-full.txt" },
  ]);

  assert.strictEqual(
    AI_INDEX_LINK_HEADER,
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );
  // The joined constant is the joined list, not a second spelling of it
  assert.strictEqual(AI_INDEX_LINK_HEADER, joinLinkHeader(AI_INDEX_LINKS));

  // The site-wide head carries the <link> projection, so the HTML document advertises the indexes too
  assert.deepStrictEqual(
    ROOT_HEAD.links.filter(({ rel }) => rel === "alternate"),
    [...AI_INDEX_LINKS]
  );
});

it("discovery links declare the sitemap and the canonical llms index", () => {
  assert.deepStrictEqual(SITEMAP_LINK, { rel: "sitemap", href: "https://www.remiforge.dev/sitemap.xml" });
  assert.deepStrictEqual(LLMS_DISCOVERY_LINK, { rel: "llms", href: "https://www.remiforge.dev/llms.txt" });
});

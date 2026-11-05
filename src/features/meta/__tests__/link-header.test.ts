// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { joinLinkHeader, languageVariantLinks } from "../domain/link-tags";
import { AI_INDEX_LINKS, AI_INDEX_LINK_HEADER } from "../domain/link-tags";
import { ROOT_HEAD } from "../domain/heads";

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
  // declaration, but this pins the runtime side of that contract: no link the site emits reaches a
  // serializer that would drop the parameter silently.
  const published = [...AI_INDEX_LINKS, ...languageVariantLinks("https://www.remiforge.dev/index.md")];

  const known: ReadonlyArray<string> = ["type", "title", "hreflang"];
  for (const link of published) {
    for (const parameter of Object.keys(link)) {
      if (parameter === "href" || parameter === "rel") continue;
      assert.include(known, parameter);
    }
  }
});

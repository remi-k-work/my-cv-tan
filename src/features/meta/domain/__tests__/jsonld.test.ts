// Direct unit tests for the graph serializer in ./jsonld.
//
// `jsonLdGraph` is the seam every head publishes through: SITE_NODES and a page's own graph are
// handed to it as one flat list, and it decides which nodes describe the same schema.org entity.
// The merge contract is what keeps the site's WebSite/Person/Organization from being published
// twice when a page graph restates them, so it is pinned here rather than only observed through
// the head builders.

import { assert, describe, it } from "@effect/vitest";
import { jsonLdGraph } from "../jsonld";
import { graphOf } from "./fixtures";
import type { JsonLdNode } from "../models";

const graphChildrenOf = (nodes: ReadonlyArray<JsonLdNode>) => jsonLdGraph(nodes).children;

const WEBSITE_ID = "https://www.remiforge.dev/#website";

it("publishes one JSON-LD script with the schema.org context", () => {
  const script = jsonLdGraph([{ "@type": "Thing", name: "A" }]);

  assert.strictEqual(script.type, "application/ld+json");
  const graph = graphOf(script.children);
  assert.strictEqual(graph.length, 1);
  assert.strictEqual(graph[0]?.["@type"], "Thing");
});

describe("merging nodes by @id", () => {
  it("merges two nodes that name the same entity into one, first occurrence keeping its slot", () => {
    // SITE_NODES publishes the Person; a page graph restates it with an extra edge. Both must
    // survive as a single node, or a parser sees two different people on the same page
    const merged = graphOf(
      graphChildrenOf([
        { "@type": "Person", "@id": "https://www.remiforge.dev/#person", name: "Remi Forge" },
        { "@type": "Person", "@id": "https://www.remiforge.dev/#person", worksFor: { "@id": "https://www.remiforge.dev/#org" } },
      ])
    );

    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0]?.["name"], "Remi Forge");
    assert.deepStrictEqual(merged[0]?.["worksFor"], { "@id": "https://www.remiforge.dev/#org" });
  });

  it("lets a later node's defined fields override the earlier ones, keeping the earlier field order", () => {
    const merged = graphOf(
      graphChildrenOf([
        { "@id": WEBSITE_ID, name: "Old name", description: "Unchanged." },
        { "@id": WEBSITE_ID, name: "New name" },
      ])
    );

    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0]?.["name"], "New name");
    // The overriding node only named `name`, so the description it never touched stays
    assert.strictEqual(merged[0]?.["description"], "Unchanged.");
    // The slot is the first occurrence's, so the published field order is stable across calls
    assert.deepStrictEqual(Object.keys(merged[0] ?? {}), ["@id", "name", "description"]);
  });

  it("never publishes a field a merge did not define", () => {
    // An undefined field is not data: spreading it would publish `key: null` and, worse, could
    // erase an earlier node's value for the same key
    const merged = graphOf(
      graphChildrenOf([
        { "@id": WEBSITE_ID, name: "Remi Forge" },
        { "@id": WEBSITE_ID, name: undefined },
      ])
    );

    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0]?.["name"], "Remi Forge");
    assert.notInclude(Object.keys(merged[0] ?? {}), "undefined");
  });

  it("keeps distinct entities distinct, so a page graph adds to the site rather than replacing it", () => {
    // The real call shape: pageHead hands jsonLdGraph([...SITE_NODES, ...pageGraph])
    const merged = graphOf(
      graphChildrenOf([
        { "@type": "WebSite", "@id": WEBSITE_ID },
        { "@type": "Person", "@id": "https://www.remiforge.dev/#person" },
        { "@type": "WebPage", "@id": "https://www.remiforge.dev/contact", name: "Contact" },
        { "@type": "Person", "@id": "https://www.remiforge.dev/#person", contactPoint: { "@id": "#point" } },
      ])
    );

    assert.strictEqual(merged.length, 3);
    assert.strictEqual(merged[0]?.["@type"], "WebSite");
    assert.strictEqual(merged[1]?.["@type"], "Person");
    assert.strictEqual(merged[2]?.["@id"], "https://www.remiforge.dev/contact");
    // The site Person carried the page's edge without becoming a different entity
    assert.deepStrictEqual(merged[1]?.["contactPoint"], { "@id": "#point" });
  });
});

describe("nodes without an @id", () => {
  it("gives every anonymous node its own slot instead of folding it into another node's fields", () => {
    const merged = graphOf(
      graphChildrenOf([
        { "@type": "BreadcrumbList", itemListElement: [] },
        { "@type": "BreadcrumbList", itemListElement: [] },
      ])
    );

    assert.strictEqual(merged.length, 2);
    assert.strictEqual(merged[0]?.["@type"], "BreadcrumbList");
    assert.strictEqual(merged[1]?.["@type"], "BreadcrumbList");
  });

  it("does not let an @id-identified node absorb an anonymous one that follows it", () => {
    // An anonymous node is keyed by its position, a key no string @id can collide with, so its
    // fields cannot leak into a neighbouring node's slot
    const merged = graphOf(
      graphChildrenOf([
        { "@type": "WebSite", "@id": WEBSITE_ID },
        { "@type": "ListItem", position: 1 },
        { "@type": "ListItem", position: 2 },
      ])
    );

    assert.strictEqual(merged.length, 3);
    assert.isUndefined(merged[0]?.["position"]);
    assert.strictEqual(merged[1]?.["position"], 1);
    assert.strictEqual(merged[2]?.["position"], 2);
  });
});

describe("escaping", () => {
  it("escapes < in serialized text so a value can never close the script element", () => {
    const script = jsonLdGraph([{ "@type": "Thing", name: "</script><script>alert(1)</script>" }]);

    assert.notInclude(script.children, "<");
    assert.include(script.children, "\\u003C");
    // The escape is transparent: a parser still reads the original text back out
    assert.strictEqual(graphOf(script.children)[0]?.["name"], "</script><script>alert(1)</script>");
  });

  it("keeps the escape transparent across a merge, so an attacker-controlled field survives round-tripping", () => {
    const merged = graphOf(
      graphChildrenOf([
        { "@id": WEBSITE_ID, name: "Remi Forge" },
        { "@id": WEBSITE_ID, description: "</script><script>alert(1)</script>" },
      ])
    );

    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0]?.["name"], "Remi Forge");
    assert.strictEqual(merged[0]?.["description"], "</script><script>alert(1)</script>");
  });
});

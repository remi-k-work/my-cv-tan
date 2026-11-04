// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option, Schema, pipe } from "effect";
import { jsonLdGraph, pageGraph } from "../domain/structured-data";

// --- The shared subpage graph pair ---
// Four page graphs lead with exactly this pair, so the @id the breadcrumb hangs from and the
// isPartOf edge are decided in one place. These tests pin the invariant the four of them rely on:
// the page node, its trail and the site entity they both reference stay one addressable graph.

// Minimal reader, mirroring the one in structured-data.test.ts: a node is an open record because the
// assertions probe arbitrary fields, and a payload that fails to decode reads as an empty graph so
// the assertions below fail loudly instead of quietly reading `undefined` off a cast.
const JsonLdNode = Schema.Record(Schema.String, Schema.Unknown);
const decodeGraph = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Struct({ "@graph": Schema.Array(JsonLdNode) })));

const graphOf = (children: string | undefined) =>
  pipe(
    decodeGraph(children ?? "{}"),
    Option.map((document) => document["@graph"] as ReadonlyArray<Record<string, unknown>>),
    Option.getOrElse<ReadonlyArray<Record<string, unknown>>>(() => [])
  );

const nodeOf = (graph: ReadonlyArray<Record<string, unknown>>, type: string) => graph.find((node) => node["@type"] === type);

const graph = pageGraph({
  type: "CollectionPage",
  path: "/education",
  name: "Education",
  description: "Schools and certificates.",
  preferredLanguage: "pl",
  mainEntity: { "@id": "https://www.remiforge.dev/education#education-list" },
});

it("pageGraph returns the page node first and its trail second, so a parser reads page-entity-first", () => {
  assert.strictEqual(graph.length, 2);
  assert.strictEqual(graph[0]?.["@type"], "CollectionPage");
  assert.strictEqual(graph[1]?.["@type"], "BreadcrumbList");
});

it("the trail's @id is the page node's @id plus a fragment, so the pair is one addressable entity", () => {
  const page = nodeOf(graph, "CollectionPage");
  const trail = nodeOf(graph, "BreadcrumbList");

  assert.strictEqual(page?.["@id"], "https://www.remiforge.dev/education");
  assert.deepStrictEqual(page?.["breadcrumb"], { "@id": "https://www.remiforge.dev/education#breadcrumb" });
  assert.strictEqual(trail?.["@id"], "https://www.remiforge.dev/education#breadcrumb");
  // The page references the trail by @id rather than embedding it, so a single parse pass resolves both
  assert.isUndefined(page?.itemListElement);
});

it("a pageGraph page node keeps the site membership, language and main entity every route declares", () => {
  const page = nodeOf(graph, "CollectionPage");

  assert.deepStrictEqual(page?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.strictEqual(page?.inLanguage, "pl");
  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/education#education-list" });
  // The URL is derived from `path` and is absolute, so a parser resolves the page from the node
  // itself instead of having to interpret a host-rooted `@id` or a breadcrumb `item` first.
  // /education and /contact used to omit it: they passed `path` only, and the one caller that
  // passed `url` was the experience page, whose value was `absoluteUrl(path)` all along.
  assert.strictEqual(page?.url, "https://www.remiforge.dev/education");
  // The same string as the @id, so the two spellings of the page can never disagree
  assert.strictEqual(page?.["url"], page?.["@id"]);
});

it("every subpage graph publishes a URL, because pageGraph derives it from the path", () => {
  // A node whose only URL spelling is a host-rooted @id costs a parser a second lookup. Walk the
  // three shapes the real callers use — CollectionPage, ContactPage and WebPage — and require each
  // one to carry the absolute URL of the page it describes.
  const paths = ["/education", "/contact", "/sample-role"] as const;
  const nodes = paths.flatMap((path) =>
    graphOf(
      jsonLdGraph([
        // The page node comes back from pageGraph, not webPageNode directly, so this pins what the
        // shared helper produces for a caller that supplies nothing but a path.
        ...pageGraph({ type: "WebPage", path, name: "N", description: "D", preferredLanguage: "en" }),
      ]).children
    )
  );

  for (const node of nodes.filter((entry) => entry["@type"] !== "BreadcrumbList")) {
    assert.strictEqual(node["url"], node["@id"]);
  }
});

it("pageGraph merges into the site entities as one document when a page head publishes it", () => {
  // The real usage: pageHead calls jsonLdGraph([...siteNodes, ...pageGraph(...)]), and the pair must
  // survive the merge as two distinct nodes rather than folding into one another.
  const merged = graphOf(
    jsonLdGraph([
      { "@type": "WebSite", "@id": "https://www.remiforge.dev/#website" },
      ...pageGraph({ type: "WebPage", path: "/contact", name: "Contact", description: "Get in touch.", preferredLanguage: "en" }),
    ]).children
  );

  assert.strictEqual(merged.filter((node) => node["@type"] === "BreadcrumbList").length, 1);
  assert.strictEqual(merged.filter((node) => node["@type"] === "WebPage").length, 1);
  assert.isDefined(nodeOf(merged, "WebSite"));
});

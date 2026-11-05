// JSON-LD graph merge and serialization. Merges nodes by @id (later declarations win),
// preserves first-seen order, and serializes the graph as a single application/ld+json script.

// services, features, and other libraries
import { Predicate } from "effect";

// domain
import { siteNodes } from "./entities";

// types
import type { JsonLdNode, JsonLdScript } from "./models";

// Escapes '<' so serialized content can never close the script tag.
const jsonLdScript = (data: unknown): JsonLdScript => ({
  type: "application/ld+json",
  children: JSON.stringify(data).replace(/</g, "\\u003C"),
});

// Strips undefined fields so they never erase an existing value during a merge.
const definedNode = (node: JsonLdNode): JsonLdNode => Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined)) as JsonLdNode;

// Merges nodes by @id, preserving order and letting defined fields override.
// Nodes without an @id are emitted exactly as written. The working array and index map are
// local to the call, so the merge is pure at its boundary while avoiding a new array per node.
export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>): JsonLdScript => {
  const graph: Array<JsonLdNode> = [];
  const indexById = new Map<string, number>();

  for (const node of nodes) {
    const defined = definedNode(node);
    const id = defined["@id"];

    if (!Predicate.isString(id)) {
      graph.push(defined);
      continue;
    }

    const existingIndex = indexById.get(id);
    if (existingIndex === undefined) {
      indexById.set(id, graph.length);
      graph.push(defined);
      continue;
    }

    graph[existingIndex] = { ...graph[existingIndex], ...defined };
  }

  return jsonLdScript({ "@context": "https://schema.org", "@graph": graph });
};

// The site entities on their own, serialized once for heads that publish no page graph.
export const siteGraphScript: JsonLdScript = jsonLdGraph(siteNodes);

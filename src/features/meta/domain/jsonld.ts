// JSON-LD serialization: escapes a graph so it can never close its own <script> element, and merges
// page graphs into the site entities by `@id`.

// services, features, and other libraries
import { Predicate, Record } from "effect";

// types
import type { JsonLdNode, JsonLdObject, JsonLdScript } from "./models";

// Escapes '<' so serialized content cannot close the HTML script tag
const jsonLdScript = (data: JsonLdObject): JsonLdScript => ({
  type: "application/ld+json",
  children: JSON.stringify(data).replace(/</g, "\\u003C"),
});

// Merges nodes by @id, preserving initial order and letting subsequent defined fields override
const mergeNodes = (nodes: ReadonlyArray<JsonLdNode>): ReadonlyArray<JsonLdNode> => {
  const indexById = new Map<string, number>();
  const graph: Array<JsonLdNode> = [];

  for (const node of nodes) {
    const defined = Record.filter(node, Predicate.isNotUndefined);
    const id = defined["@id"];
    const existing = Predicate.isString(id) ? indexById.get(id) : undefined;

    if (existing === undefined) {
      if (Predicate.isString(id)) indexById.set(id, graph.length);
      graph.push(defined);
    } else {
      graph[existing] = { ...graph[existing], ...defined };
    }
  }

  return graph;
};

export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>) => jsonLdScript({ "@context": "https://schema.org", "@graph": mergeNodes(nodes) });

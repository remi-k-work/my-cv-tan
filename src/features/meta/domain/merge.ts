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
// Nodes without an @id are emitted exactly as written. Pure: no array mutation, no non-null asserts.
export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>): JsonLdScript => {
  type MergeState = {
    readonly graph: Array<JsonLdNode>;
    readonly indexById: Map<string, number>;
  };

  const { graph } = nodes.reduce<MergeState>(
    (state, node) => {
      const nd = definedNode(node);
      const id = nd["@id"];
      if (!Predicate.isString(id)) return { ...state, graph: [...state.graph, nd] };

      const existingIndex = state.indexById.get(id);
      if (existingIndex === undefined) {
        return {
          graph: [...state.graph, nd],
          indexById: new Map(state.indexById).set(id, state.graph.length),
        };
      }

      return {
        graph: state.graph.map((existing, index) => (index === existingIndex ? { ...existing, ...nd } : existing)),
        indexById: state.indexById,
      };
    },
    { graph: [] as Array<JsonLdNode>, indexById: new Map<string, number>() }
  );

  return jsonLdScript({ "@context": "https://schema.org", "@graph": graph });
};

// The site entities on their own, serialized once for heads that publish no page graph.
export const siteGraphScript: JsonLdScript = jsonLdGraph(siteNodes);

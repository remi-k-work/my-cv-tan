// JSON-LD serialization: escapes a graph so it can never close its own <script> element, and merges
// page graphs into the site entities by `@id`.

// services, features, and other libraries
import { Array, Predicate, Record, String, pipe } from "effect";

// types
import type { JsonLdNode, JsonLdObject, JsonLdScript } from "./models";

// Escapes '<' so serialized content cannot close the HTML script tag
const jsonLdScript = (data: JsonLdObject): JsonLdScript => ({
  type: "application/ld+json",
  children: pipe(JSON.stringify(data), String.replaceAll(/</g, "\\u003C")),
});

// Merges nodes by @id, preserving initial order and letting subsequent defined fields override
const mergeNodes = (nodes: ReadonlyArray<JsonLdNode>): ReadonlyArray<JsonLdNode> => {
  const merged = Array.reduce(
    nodes,
    new Map<string | number, JsonLdNode>(),
    // Re-setting a Map key preserves its first-insertion position, so the first occurrence of an
    // @id owns the node's slot and later nodes merge their defined fields into it
    (graph, node, index) => {
      const defined = Record.filter(node, Predicate.isNotUndefined);
      const id = defined["@id"];

      // Only an @id-identified node can merge into an earlier one: an anonymous node gets its own
      // slot, keyed by its position (a key no string @id can collide with), instead of being
      // folded into some other node's fields
      const key = Predicate.isString(id) ? id : index;

      return graph.set(key, { ...graph.get(key), ...defined });
    }
  );

  return Array.fromIterable(merged.values());
};

export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>) => jsonLdScript({ "@context": "https://schema.org", "@graph": mergeNodes(nodes) });

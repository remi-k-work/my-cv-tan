// JSON-LD serialization: escapes a graph so it can never close its own <script> element, and merges
// page graphs into the site entities by `@id`.

// services, features, and other libraries
import { Array, HashMap, Option, Predicate, Record, String, pipe } from "effect";

// types
import type { JsonLdNode, JsonLdObject, JsonLdScript } from "./models";

type NodeKey = string | number;

interface MergeState {
  readonly order: ReadonlyArray<NodeKey>;
  readonly nodes: HashMap.HashMap<NodeKey, JsonLdNode>;
}

// Escapes '<' so serialized content cannot close the HTML script tag
const jsonLdScript = (data: JsonLdObject): JsonLdScript => ({
  type: "application/ld+json",
  children: pipe(JSON.stringify(data), String.replaceAll(/</g, "\\u003C")),
});

// Typing the empty accumulator separately is what an inline literal could only express with a cast
const emptyMergeState: MergeState = { order: [], nodes: HashMap.empty<NodeKey, JsonLdNode>() };

// Merges nodes by @id, preserving first-occurrence order and letting subsequent defined fields override
const mergeNodes = (nodes: ReadonlyArray<JsonLdNode>): ReadonlyArray<JsonLdNode> => {
  const { order, nodes: merged } = Array.reduce(nodes, emptyMergeState, (state, node, index) => {
    const defined = Record.filter(node, Predicate.isNotUndefined);
    const id = defined["@id"];

    // Anonymous nodes key by position so they never fold into an earlier entity's slot
    const key: NodeKey = Predicate.isString(id) ? id : index;
    return Option.match(HashMap.get(state.nodes, key), {
      onNone: () => ({
        order: Array.append(state.order, key),
        nodes: HashMap.set(state.nodes, key, defined),
      }),
      onSome: (previous) => ({
        order: state.order,
        nodes: HashMap.set(state.nodes, key, { ...previous, ...defined }),
      }),
    });
  });

  // Every key was inserted before it was recorded, so this reads the merged nodes in first-seen order
  return Array.getSomes(Array.map(order, (key) => HashMap.get(merged, key)));
};

export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>) => jsonLdScript({ "@context": "https://schema.org", "@graph": mergeNodes(nodes) });

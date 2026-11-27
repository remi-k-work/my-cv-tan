// Readers that parse a rendered JSON-LD <script> back into the graph a crawler would read.
//
// They live with the jsonld feature, beside the serializer they read, so its own tests need no meta
// helper; the meta tests that inspect a head's script import them from here. Shared sample records
// and copy live in `@/testing/fixtures`; meta-tag readers live in the meta feature.

// services, features, and other libraries
import { Option, Schema, pipe } from "effect";

// The whole JSON-LD document a crawler parses, so a reader can reach the @context it reads first
// and the @graph it reads second. `@context` is optional because only the document's own
// serialization decides it; `@graph` stays required, so a payload that fails the decode still
// reads as no graph at all — the assertions fail loudly instead of reading `undefined` off a cast
const decodeDocument = Schema.decodeUnknownOption(
  Schema.fromJsonString(Schema.Struct({ "@context": Schema.optionalKey(Schema.Unknown), "@graph": Schema.Array(Schema.Record(Schema.String, Schema.Unknown)) }))
);
const decodeText = Schema.decodeUnknownOption(Schema.String);
const decodeNodes = Schema.decodeUnknownOption(Schema.Array(Schema.Record(Schema.String, Schema.Unknown)));

type JsonLdDocument = { readonly "@context"?: unknown; readonly "@graph"?: ReadonlyArray<Record<string, unknown>> };

export const documentOf = (children: string | undefined): Option.Option<JsonLdDocument> => decodeDocument(children ?? "{}");

export const graphOf = (children: string | undefined): ReadonlyArray<Record<string, unknown>> =>
  pipe(
    documentOf(children),
    Option.flatMapNullishOr((document) => document["@graph"]),
    Option.getOrElse<ReadonlyArray<Record<string, unknown>>>(() => [])
  );

// The vocabulary a JSON-LD document declares before its graph. A payload that fails the decode — or
// declares one that is not text — reads as no vocabulary at all, so an assertion about the published
// @context fails rather than quietly comparing undefined
export const contextOf = (children: string | undefined): string | undefined =>
  pipe(
    documentOf(children),
    Option.flatMap((document) => decodeText(document["@context"])),
    Option.getOrUndefined
  );

// A node is an open record because the assertions probe arbitrary fields; `idFragment` narrows a
// lookup to one @id when a page publishes several nodes of the same type
export const nodeOf = (graph: ReadonlyArray<Record<string, unknown>>, type: string, idFragment?: string) =>
  graph.find((node) => node["@type"] === type && (idFragment === undefined || String(node["@id"]).endsWith(idFragment)));

// Reads a graph node's field back as text: the open record types every value as unknown
export const textOf = (value: unknown): Option.Option<string> => decodeText(value);

// Reads one array-valued field of a graph node back as a list of nodes: an open record types every
// value as unknown, and a field that is absent or not a list reads as an empty one
export const nodesOf = (node: Record<string, unknown> | undefined, key: string): ReadonlyArray<Record<string, unknown>> =>
  pipe(
    Option.fromNullishOr(node),
    Option.flatMap((value) => decodeNodes(value[key])),
    Option.getOrElse<ReadonlyArray<Record<string, unknown>>>(() => [])
  );
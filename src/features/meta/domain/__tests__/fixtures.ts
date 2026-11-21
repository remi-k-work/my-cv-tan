// The inputs and readers the meta feature's unit tests share.
//
// The graph readers and sample records used to be spelled out separately in every test file, so a
// fix in one copy left the others behind — and one copy carried a cast the others never needed.
// They live here now: one definition per value, and the readers parse back exactly what a crawler
// would take out of the rendered `<script>` element.

// services, features, and other libraries
import { Option, Schema, pipe } from "effect";

// types
import type { PageTitles, PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { MetaTag, PageHead } from "../models";

// constants
export const LANGUAGE: PreferredLanguage = "en";

export const sampleExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

export const sampleEducation: EducationList = [{ name: "Pratt Institute", year: "• 2002 — 2004 •", location: "New York, US", info: "Interactive Media." }];

export const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

// The whole JSON-LD document a crawler parses, so a reader can reach the @context it reads first
// and the @graph it reads second. `@context` is optional because only the document's own
// serialization decides it; `@graph` stays required, so a payload that fails the decode still
// reads as no graph at all — the assertions fail loudly instead of reading `undefined` off a cast
const decodeDocument = Schema.decodeUnknownOption(
  Schema.fromJsonString(Schema.Struct({ "@context": Schema.optionalKey(Schema.Unknown), "@graph": Schema.Array(Schema.Record(Schema.String, Schema.Unknown)) }))
);
const decodeText = Schema.decodeUnknownOption(Schema.String);
const decodeNodes = Schema.decodeUnknownOption(Schema.Array(Schema.Record(Schema.String, Schema.Unknown)));
const decodeMetaTags = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Array(Schema.Record(Schema.String, Schema.String))));

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

// Meta tags are a flat union, so a JSON round trip reads them back as the plain records the
// assertions compare against; like the graph readers above, a payload that fails the decode reads
// as an empty list, so a regression fails loudly instead of quieting reading undefined off a cast
export const metaTagsOf = (tags: ReadonlyArray<MetaTag>): ReadonlyArray<Record<string, string>> =>
  pipe(
    decodeMetaTags(JSON.stringify(tags)),
    Option.getOrElse<ReadonlyArray<Record<string, string>>>(() => [])
  );

export const metaOf = (head: PageHead) => metaTagsOf(head.meta ?? []);

export const tagContent = (tags: ReadonlyArray<Record<string, string>>, key: "property" | "name", value: string) =>
  tags.find((tag) => tag[key] === value)?.content;

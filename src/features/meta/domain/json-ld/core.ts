// --- JSON-LD graph construction ---
//
// Every page head publishes exactly one `<script type="application/ld+json">` block whose `@graph`
// merges the site-wide entities (WebSite, Person, Organization) with the page's own nodes. The
// merge is copy-on-write: later declarations fold into earlier ones by `@id`, later fields winning,
// and module-constant site nodes are never mutated across renders.
//
// Pure by design: heads are rendered synchronously in route `head()` functions, so the graph
// builders stay Effect-free. Effect data types (`Option`, `Predicate`) are used for total,
// throw-free decoding of untrusted node shapes.

// services, features, and other libraries
import { Array, Option, Predicate } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { absoluteUrl } from "../url";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdScript } from "../models";

// constants
import { PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "../constants";

// Serialized JSON lives inside a <script> tag; escaping "<" as "\u003C" stops content-sourced
// strings from breaking out of the tag while staying valid JSON.
const jsonLdScript = (data: unknown): JsonLdScript => ({ type: "application/ld+json", children: JSON.stringify(data).replace(/</g, "\\u003C") });

// The one @context the whole site publishes — every node shares https://schema.org, so the graph
// is self-describing to any schema.org consumer.
const SCHEMA_CONTEXT = "https://schema.org";

// A published schema.org node: a rich object carrying its "@type", or a bare {"@id": …}
// cross-reference / embedded value object. The index signature is open because schema.org allows
// arbitrary properties on any node.
export interface JsonLdNode {
  readonly "@type"?: string;
  readonly "@id"?: string;
  readonly [property: string]: unknown;
}

// A page's own schema.org nodes, before the site entities are merged in
export type JsonLdNodes = ReadonlyArray<JsonLdNode>;

// The identity the merge runs on: a node declaring both a @type and a string @id. A node with no
// stable @id and no @type is a cross-reference or an embedded value object: published verbatim.
// Predicate.isString (per the Effect AGENTS.md) replaces a hand-rolled typeof check.
const declaredId = (node: JsonLdNode): Option.Option<string> =>
  Predicate.isString(node["@id"]) && node["@type"] !== undefined ? Option.some(node["@id"]) : Option.none();

// The merge slot a node occupies: its declared @id, or its own array index when it has none.
// An index slot can never collide with a host-rooted @id, so unidentified nodes always publish
// verbatim instead of absorbing into a neighbour.
type MergeSlot = number | string;

// --- The @graph merge ---

// Nodes sharing an @id fold into one definition, so a page extending the site Person with one more
// edge publishes a single entity carrying every property rather than two competing definitions —
// which is what makes a parser fork the entity. The first occurrence keeps its position and a later
// declaration merges into it with its own fields winning.
//
// The merge is copy-on-write: it writes a brand-new object rather than extending the first
// declaration in place, which is what keeps the module-constant site nodes shared across renders.
export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>): JsonLdScript => {
  // Classify each node into a merge slot: declared @id (with @type) wins the slot;
  // unidentified nodes fall back to their own index so they publish verbatim.
  const mergeSlot = (node: JsonLdNode, index: number): MergeSlot => Option.getOrElse(declaredId(node), () => index);

  // Fold left over the nodes: later declarations merge into earlier ones, later fields winning.
  // Copy-on-write keeps module-constant site nodes shared across renders.
  const merged = Array.reduce(nodes, new Map<MergeSlot, JsonLdNode>(), (slots, node, index) => {
    const slot = mergeSlot(node, index);
    const existing = slots.get(slot);
    slots.set(slot, existing === undefined ? node : { ...existing, ...node });
    return slots;
  });

  return jsonLdScript({ "@context": SCHEMA_CONTEXT, "@graph": Array.fromIterable(merged.values()) });
};

// --- Page-level node shapes ---

// The four page-level types this site emits
type PageNodeType = "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";

// An Article node for article-like pages (experience details). schema.org Article is a subtype of
// CreativeWork, so it sits beside — not instead of — the page's existing main entity. It carries
// the author and publisher edges that make the page citable without parsing body prose.
// Conditional fields are spread in rather than assigned after construction: the object is built
// once and never mutated, so there is no intermediate partially-built state a caller could observe.
export const articleNode = (input: {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly datePublished?: string;
  readonly mainEntityOfPage?: string;
}): JsonLdNode =>
  ({
    "@type": "Article",
    "@id": input.id,
    headline: input.headline,
    description: input.description,
    inLanguage: input.preferredLanguage,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PUBLISHER_ID },
    // A factual freshness signal only where the source data carries one; omitted entirely otherwise
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    // The page this article describes, as a @id cross-reference the merge resolves in one pass
    ...(input.mainEntityOfPage ? { mainEntityOfPage: { "@id": input.mainEntityOfPage } } : {}),
  }) as JsonLdNode;

// One page-level node shape shared by every route: keeps @id, language, site membership, breadcrumb
// reference and main entity consistent across the site. Absent properties are written `undefined`,
// which JSON.stringify drops.
//
// The node takes `id` and `url` rather than a path, so the one caller that cannot derive its @id
// from a route — the home ProfilePage, whose identity is a host-rooted #profile fragment — declares
// it, while every subpage goes through pageGraph below and never has to.
//
// `datePublished` is optional: it is a factual freshness signal only where the source data carries
// a year (experience pages). It is never fabricated — a missing value is simply omitted so AI
// crawlers never see a date the site does not actually know.
export const webPageNode = (input: {
  readonly type: PageNodeType;
  readonly id: string;
  readonly url?: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly breadcrumb?: boolean;
  readonly mainEntity?: unknown;
  readonly primaryImageOfPage?: unknown;
  readonly datePublished?: string;
}) => ({
  "@type": input.type,
  "@id": input.id,
  url: input.url,
  name: input.name,
  description: input.description,
  inLanguage: input.preferredLanguage,
  isPartOf: { "@id": WEBSITE_ID },
  // Pages reference their trail by @id, associating it with the page node the way Google expects
  breadcrumb: input.breadcrumb ? { "@id": `${input.id}#breadcrumb` } : undefined,
  mainEntity: input.mainEntity,
  primaryImageOfPage: input.primaryImageOfPage,
  // JSON.stringify drops undefined, so a page without a known date publishes no datePublished at all.
  datePublished: input.datePublished,
});

// Everything a subpage graph needs: the page's own kind, the path that answers both "which URL" and
// "which @id", and the two entities the page node points at.
interface SubPageInput {
  readonly type: PageNodeType;
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly mainEntity?: unknown;
  readonly primaryImageOfPage?: unknown;
  readonly datePublished?: string;
}

// The pair every subpage graph leads with: its own page node plus the two-level trail. Four page
// graphs repeat exactly this pair, so the @id the trail hangs from and the isPartOf edge are decided
// here once instead of four times with four chances to disagree.
//
// `id` and `url` are both derived from `path` and are the same string, because a node carrying a
// host-rooted @id and no URL of its own costs a parser a second lookup before it can resolve the
// page described.
export const pageGraph = ({ type, path, name, description, preferredLanguage, mainEntity, primaryImageOfPage, datePublished }: SubPageInput): JsonLdNodes => {
  const id = absoluteUrl(path);

  return [
    webPageNode({ type, id, url: id, name, description, preferredLanguage, breadcrumb: true, mainEntity, primaryImageOfPage, datePublished }),
    breadcrumb(preferredLanguage, path, name),
  ];
};

// Labelled, ordered group of references: reads like an ItemList to AI parsers without registering as
// a Google Carousel candidate. The carousel beta only supports Course, Movie, Recipe and Restaurant
// items (and expects a single list per page), so these grouped lists could only ever surface as
// "invalid" in Search Console and the Rich Results Test.
export const collectionNode = (input: {
  readonly id: string;
  readonly name: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly parts: ReadonlyArray<unknown>;
  readonly url?: string;
}) => ({
  "@type": "Collection",
  "@id": input.id,
  url: input.url,
  name: input.name,
  inLanguage: input.preferredLanguage,
  hasPart: input.parts,
});

// --- The remaining shared node shapes ---

// Image with verified dimensions: scrapers get the real size without fetching the file
export const imageObject = (url: string, width: number, height: number) => ({ "@type": "ImageObject", url, width, height }) as const;

// Shared two-level trail: every subpage hangs directly off the homepage. Crumb names follow the page
// language, matching the localized copy Google and AI systems extract.
export const breadcrumb = (preferredLanguage: PreferredLanguage, path: string, name: string) =>
  ({
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: [
      // Byte-equal to the homepage canonical so structured data and canonical signals agree
      { "@type": "ListItem", position: 1, name: matchPreferredLanguage(preferredLanguage, "Home", "Strona główna"), item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  }) as const;

// A Person node carrying only a new edge: re-declaring the root Person @id makes the graph merge it
// in one parser pass, so an extractor reads the relationship from either direction.
export const personEdge = <Fields extends Readonly<Record<string, unknown>>>(fields: Fields) => ({
  "@type": "Person",
  "@id": PERSON_ID,
  ...fields,
});

// Pure schema.org JSON-LD graph construction and node deduplication.

// services, features, and other libraries
import { Array, Option, Predicate } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { absoluteUrl } from "@/features/meta/domain/url";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdScript } from "@/features/meta/domain/models";

interface JsonLdNode {
  readonly "@type"?: string;
  readonly "@id"?: string;
  readonly [property: string]: unknown;
}

export type JsonLdNodes = ReadonlyArray<JsonLdNode>;
type MergeSlot = number | string;
type PageNodeType = "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";

interface ArticleNodeInput {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly datePublished?: string;
  readonly mainEntityOfPage?: string;
}

interface WebPageNodeInput {
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
}

interface CollectionNodeInput {
  readonly id: string;
  readonly name: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly parts: ReadonlyArray<unknown>;
  readonly url?: string;
}

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

// constants
import { PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "@/features/meta/domain/constants";

// Escapes '<' as unicode to prevent breaking out of script tags when serialized.
const jsonLdScript = (data: unknown): JsonLdScript => ({ type: "application/ld+json", children: JSON.stringify(data).replace(/</g, "\\u003C") });

const SCHEMA_CONTEXT = "https://schema.org";

const declaredId = (node: JsonLdNode): Option.Option<string> =>
  Predicate.isString(node["@id"]) && node["@type"] !== undefined ? Option.some(node["@id"]) : Option.none();

// Merges nodes by @id, preserving initial order and overriding overlapping fields.
export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>): JsonLdScript => {
  const mergeSlot = (node: JsonLdNode, index: number): MergeSlot => Option.getOrElse(declaredId(node), () => index);

  const merged = Array.reduce(nodes, new Map<MergeSlot, JsonLdNode>(), (slots, node, index) => {
    const slot = mergeSlot(node, index);
    const existing = slots.get(slot);
    slots.set(slot, existing === undefined ? node : { ...existing, ...node });
    return slots;
  });

  return jsonLdScript({ "@context": SCHEMA_CONTEXT, "@graph": Array.fromIterable(merged.values()) });
};

// schema.org Article node for experience detail pages.
export const articleNode = (input: ArticleNodeInput): JsonLdNode =>
  ({
    "@type": "Article",
    "@id": input.id,
    headline: input.headline,
    description: input.description,
    inLanguage: input.preferredLanguage,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PUBLISHER_ID },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.mainEntityOfPage ? { mainEntityOfPage: { "@id": input.mainEntityOfPage } } : {}),
  }) as JsonLdNode;

// Shared schema.org WebPage node builder.
export const webPageNode = (input: WebPageNodeInput) => ({
  "@type": input.type,
  "@id": input.id,
  url: input.url,
  name: input.name,
  description: input.description,
  inLanguage: input.preferredLanguage,
  isPartOf: { "@id": WEBSITE_ID },
  breadcrumb: input.breadcrumb ? { "@id": `${input.id}#breadcrumb` } : undefined,
  mainEntity: input.mainEntity,
  primaryImageOfPage: input.primaryImageOfPage,
  datePublished: input.datePublished,
});

// Emits a WebPage node paired with its two-level breadcrumb list.
export const pageGraph = ({ type, path, name, description, preferredLanguage, mainEntity, primaryImageOfPage, datePublished }: SubPageInput): JsonLdNodes => {
  const id = absoluteUrl(path);

  return [
    webPageNode({ type, id, url: id, name, description, preferredLanguage, breadcrumb: true, mainEntity, primaryImageOfPage, datePublished }),
    breadcrumb(preferredLanguage, path, name),
  ];
};

// Grouped collection node for grouped links or entities.
export const collectionNode = (input: CollectionNodeInput) => ({
  "@type": "Collection",
  "@id": input.id,
  url: input.url,
  name: input.name,
  inLanguage: input.preferredLanguage,
  hasPart: input.parts,
});

// ImageObject helper with verified dimensions.
export const imageObject = (url: string, width: number, height: number) => ({ "@type": "ImageObject", url, width, height }) as const;

// Two-level breadcrumb trail connecting the subpage to home.
const breadcrumb = (preferredLanguage: PreferredLanguage, path: string, name: string) =>
  ({
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: matchPreferredLanguage(preferredLanguage, "Home", "Strona główna"), item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  }) as const;

// Extends the site Person entity with an additional edge during graph merging.
export const personEdge = <Fields extends Readonly<Record<string, unknown>>>(fields: Fields) => ({ "@type": "Person", "@id": PERSON_ID, ...fields });

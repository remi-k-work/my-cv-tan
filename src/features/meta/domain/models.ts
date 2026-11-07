// The HTML head element contract: the shapes TanStack Router's `head()` results are built from,
// and nothing else. A head is a flat set of document elements, so this module has no dependencies
// — the input contracts each builder consumes are declared by that builder, beside the head it
// builds: the social card's in ./social-meta, the detail page's in ./experience-seo, and the
// static pages' in ./page-head.

// --- HTML Head Elements ---

// Discriminated union of valid <meta> tags.
export type MetaTag =
  | { readonly charSet: "utf-8" }
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

// Valid attributes for <link> tags emitted by head builders and RFC 8288 Link headers.
export interface LinkTag {
  readonly rel: string;
  readonly href: string;
  readonly type?: string;
  readonly title?: string;
  readonly hreflang?: string;
}

// Structured data script tag for JSON-LD graphs.
export interface JsonLdScript {
  readonly type: "application/ld+json";
  readonly children: string;
}

// JSON-LD values stay within JSON's value set. Undefined is allowed only on object fields, where
// JSON.stringify omits it; inside arrays it would silently become null and change the graph.
export type JsonLdValue = string | number | boolean | null | JsonLdObject | ReadonlyArray<JsonLdValue>;

export interface JsonLdObject {
  readonly [property: string]: JsonLdValue | undefined;
}

// Open-ended schema.org node; `@id` is what makes it mergeable in a graph.
export interface JsonLdNode extends JsonLdObject {
  readonly "@type"?: string;
  readonly "@id"?: string;
}

export type JsonLdNodes = ReadonlyArray<JsonLdNode>;

// Head elements consumed by TanStack Router route head() functions. The arrays are deliberately
// mutable: the framework's expected head shape is `Array<...>`, so a readonly contract here would
// be rejected at every route that returns this type. The builders still hand back fresh arrays,
// so no caller can reach another page's elements through one head.
export interface PageHead {
  readonly meta: Array<MetaTag>;
  readonly links: Array<LinkTag>;
  readonly scripts: Array<JsonLdScript>;
}

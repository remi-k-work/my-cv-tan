// The meta feature's cross-module contracts: the flat head elements every head projection returns,
// the JSON-LD values it serializes, the site-identity shapes the SEO/Markdown surfaces share, and
// the small slice of the TanStack match chain the head resolvers read. Module-local input structs
// live beside the builders that consume them; only what crosses a module or feature boundary is here.

// services, features, and other libraries
import { Option } from "effect";

// types
import type { PagePath, PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";

export type MetaTag =
  | { readonly charSet: "utf-8" }
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

export interface LinkTag {
  readonly rel: string;
  readonly href: string;
  readonly type?: string;
  readonly title?: string;
  readonly hreflang?: string;
}

export interface JsonLdScript {
  readonly type: "application/ld+json";
  readonly children: string;
}

type JsonLdValue = string | number | boolean | null | JsonLdObject | ReadonlyArray<JsonLdValue>;

export interface JsonLdObject {
  readonly [property: string]: JsonLdValue | undefined;
}

export interface JsonLdNode extends JsonLdObject {
  readonly "@type"?: string;
  readonly "@id"?: string;
}

export type JsonLdNodes = ReadonlyArray<JsonLdNode>;

// Flat head elements consumed by TanStack Router route head() functions
export interface PageHead {
  readonly meta: Array<MetaTag>;
  readonly links: Array<LinkTag>;
  readonly scripts: Array<JsonLdScript>;
}

// The site-shell head: the same elements as a page head, minus the JSON-LD graph the root omits
export interface RootHead {
  readonly meta: ReadonlyArray<MetaTag>;
  readonly links: ReadonlyArray<LinkTag>;
}

export interface SocialImageFacts {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

export interface SocialImage extends SocialImageFacts {
  readonly alt: string;
}

export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: "employment" | "portfolio";
}

// The SEO identity of one experience: the single record the HTML head, the JSON-LD graph and the
// Markdown twin all derive from, so their canonical URL, headline and description can never drift.
export interface ExperienceSeo {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
  readonly path: string;
  readonly canonical: string;
  readonly markdownPath: string;
  readonly headline: string;
  readonly description: string;
  readonly screenshot: Option.Option<SocialImageFacts>;
}

export type StaticPageType = "overview" | "education" | "contact";

// A static page resolved for one reader: the localized copy the HTML head, Markdown twin and
// sitemap all publish.
export interface StaticPageCopy {
  readonly path: PagePath;
  readonly mdHref: string;
  readonly type: StaticPageType;
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly seoTitle: string;
  readonly intro: string;
  readonly canonical: string;
}

export type RouteStatus = "pending" | "success" | "error" | "notFound";

// The slice of a TanStack match chain the head resolvers read. `_notFound` is router-private, but
// it is the only signal available when a loader throws notFound()
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown; readonly status?: RouteStatus; readonly _notFound?: boolean }>;

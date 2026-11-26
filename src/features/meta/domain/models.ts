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
  // TanStack forwards link descriptors to React, which names this property hrefLang
  readonly hrefLang?: string;
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

export interface SocialImageFacts {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

export interface SocialImage extends SocialImageFacts {
  readonly alt: string;
}

export type ExperienceSection = "employment" | "portfolio";

export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: ExperienceSection;
}

// Shared input for the identity, content and head projections below
export interface ExperienceIdentityInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}

// Identity shared by every experience representation, including projections that do not need a
// description or image and should not process the full narrative
export interface ExperienceIdentity {
  readonly preferredLanguage: PreferredLanguage;
  readonly path: string;
  readonly canonical: string;
  readonly markdownPath: string;
  readonly headline: string;
}

// Experience content adds the full narrative summary to the shared identity without doing image work
export interface ExperienceContent extends ExperienceIdentity {
  readonly experience: Experience;
  readonly description: string;
}

// The HTML detail head additionally needs a social image; Markdown and catalogue builders do not
export interface ExperienceSeo extends ExperienceContent {
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

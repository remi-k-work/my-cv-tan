// The meta feature's cross-module contracts: the flat head elements every head projection returns,
// the JSON-LD values it serializes, the site-identity shapes the SEO/Markdown surfaces share, and
// the small slice of the TanStack match chain the head resolvers read. Module-local input structs
// live beside the builders that consume them; only what crosses a module or feature boundary is here.

// services, features, and other libraries
import { Option } from "effect";

// types
import type { LinkTag } from "@/domain/links";
import type { ImageFacts, PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";

export type MetaTag =
  | { readonly charSet: "utf-8" }
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

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

export interface SocialImage extends ImageFacts {
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

// Full detail projections add narrative and image facts to the lightweight identity
export interface ExperienceSeo extends ExperienceIdentity {
  readonly experience: Experience;
  readonly description: string;
  readonly screenshot: Option.Option<ImageFacts>;
}

export type RouteStatus = "pending" | "success" | "error" | "notFound";

// The slice of a TanStack match chain the head resolvers read. `_notFound` is router-private, but
// it is the only signal available when a loader throws notFound()
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown; readonly status?: RouteStatus; readonly _notFound?: boolean }>;

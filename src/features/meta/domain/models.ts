// The meta feature's cross-module contracts: the flat head elements every head projection returns,
// the social-card shapes the head builders publish, and the small slice of the TanStack match chain
// the head resolvers read. JSON-LD types belong to the `jsonld` feature; the head only carries the
// script element it publishes. Module-local input structs live beside the builders that consume
// them; only what crosses a module or feature boundary is here.

// types
import type { JsonLdScript } from "@/features/jsonld/domain/models";
import type { LinkTag } from "@/domain/links";
import type { ImageFacts, PreferredLanguage } from "@/domain/models";
import type { ExperienceSection } from "@/features/experience/domain/models";

export type MetaTag =
  | { readonly charSet: "utf-8" }
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

// Flat head elements consumed by TanStack Router route head() functions
export interface PageHead {
  readonly meta: Array<MetaTag>;
  readonly links: Array<LinkTag>;
  readonly scripts: Array<JsonLdScript>;
}

export interface SocialImage extends ImageFacts {
  readonly alt: string;
}

export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: ExperienceSection;
}

export type RouteStatus = "pending" | "success" | "error" | "notFound";

// The slice of a TanStack match chain the head resolvers read. `_notFound` is router-private, but
// it is the only signal available when a loader throws notFound()
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown; readonly status?: RouteStatus; readonly _notFound?: boolean }>;

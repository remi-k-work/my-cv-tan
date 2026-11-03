// Strongly-typed head metadata and route head contracts.

// types
import type { Experience } from "@/features/experience/domain/models";
import type { PageTitles, PreferredLanguage } from "@/domain/models";

// Discriminated union of valid <meta> tags.
export type MetaTag =
  | { readonly charSet: "utf-8" }
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

// Valid attributes for <link> tags emitted by head builders.
export type LinkTag = { readonly rel: string; readonly href: string; readonly type?: string; readonly title?: string };

// Structured data script tag for JSON-LD graphs.
export type JsonLdScript = { readonly type: "application/ld+json"; readonly children: string };

// Head elements consumed by TanStack Router route head() functions.
export interface PageHead {
  readonly meta: Array<MetaTag>;
  readonly links: Array<LinkTag>;
  readonly scripts: Array<JsonLdScript>;
}

// Input for experience detail page head builder.
export interface ExperienceHeadInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}

// Input for static page head builders.
export interface StaticPageHeadInput {
  readonly pageTitles: PageTitles;
  readonly preferredLanguage: PreferredLanguage;
}

// Empty head structure for unmatched routes or missing loader data.
export const emptyHead: PageHead = { meta: [], links: [], scripts: [] };

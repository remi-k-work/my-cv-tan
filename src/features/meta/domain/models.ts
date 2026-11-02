// The <head> vocabulary: what a route hands a head builder, and the shape the builder hands back.
//
// Named shapes rather than TanStack's `Record<string, unknown>` catch-all, so an entry carrying
// neither `name` nor `property` — a misspelled tag the router then drops silently at render time —
// is a compile error instead of a page quietly missing its metadata.
//
// These are plain TypeScript types because every MetaTag/LinkTag value is constructed internally by
// the head builders, never parsed from untrusted input. Schema validation lives at the boundaries
// that actually receive untrusted data: URL decoding (url.ts), language decoding (language.ts), and
// asset decoding (data layer).

// types
import type { Experience } from "@/features/experience/domain/models";
import type { PageTitles, PreferredLanguage } from "@/domain/models";

// One <meta> tag entry: either a charset, a title, a name/content pair, or a property/content pair.
// The union is closed so a misspelled tag is a compile error, not a silent render-time drop.
export type MetaTag =
  | { readonly charSet: "utf-8" }
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

// One <link> entry: the attributes links.ts and the icon tags actually emit
export type LinkTag = { readonly rel: string; readonly href: string; readonly type?: string; readonly title?: string };

// One <script type="application/ld+json"> tag. Required on PageHead, because a page head without
// one would publish no structured data and no optional type could say so.
export type JsonLdScript = { readonly type: "application/ld+json"; readonly children: string };

// The three keys TanStack reads off a route's head() result.
// Arrays are mutable (not `ReadonlyArray`) because TanStack spreads/concats them at render time.
// The properties themselves are still `readonly` so a route cannot reassign the whole array.
export interface PageHead {
  readonly meta: Array<MetaTag>;
  readonly links: Array<LinkTag>;
  readonly scripts: Array<JsonLdScript>;
}

// The loader matches the URL slug against experience.slug, so the data slug alone drives every
// canonical, social and JSON-LD URL; the two can never drift apart
export interface ExperienceHeadInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}

// What a route hands a static page head: the stable copy key it resolves its own text through, and
// the language that copy resolves in. The resolved result is `StaticPageCopy` in static-pages.ts —
// this is the input side, so the two are counterparts rather than duplicates.
export interface StaticPageHeadInput {
  readonly pageTitles: PageTitles;
  readonly preferredLanguage: PreferredLanguage;
}

// Empty head contribution used when a route has no loader data and no fallback path. TanStack
// ignores an empty object in head() merges, so this is the type-safe way to publish nothing.
export const emptyHead: PageHead = { meta: [], links: [], scripts: [] };

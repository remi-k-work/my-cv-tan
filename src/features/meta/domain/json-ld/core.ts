// services, features, and other libraries
import { matchPreferredLanguage } from "@/domain";
import { absoluteUrl } from "../url";

// types
import type { PreferredLanguage } from "@/domain";
import type { JsonLdScript } from "../models";

// Serialized JSON lives inside a <script> tag; escaping "<" as "\u003C" stops
// content-sourced strings from breaking out of the tag while staying valid JSON
export const jsonLdScript = (data: unknown): JsonLdScript => ({ type: "application/ld+json", children: JSON.stringify(data).replace(/</g, "\\u003C") });

// Every page emits exactly one script: nodes share a single @graph so @id cross-references stay intact in a single parser pass
export const jsonLdGraph = (nodes: ReadonlyArray<unknown>): JsonLdScript => jsonLdScript({ "@context": "https://schema.org", "@graph": [...nodes] });

// List-derived nodes are only meaningful when the list decoded and is non-empty
export const whenNonEmpty = <T, N>(list: ReadonlyArray<T>, build: (items: ReadonlyArray<T>) => N): ReadonlyArray<N> => (list.length === 0 ? [] : [build(list)]);

// Image with verified dimensions: scrapers get the real size without fetching the file
export const imageObject = (url: string, width: number, height: number) => ({ "@type": "ImageObject", url, width, height }) as const;

// Shared two-level trail: every subpage hangs directly off the homepage. Crumb names follow
// the page language, matching the localized copy Google and AI systems extract
export const breadcrumb = (preferredLanguage: PreferredLanguage, path: string, name: string) =>
  ({
    "@type": "BreadcrumbList",
    // Pages reference the trail by @id, associating it with the page node the way Google expects
    "@id": `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: [
      // Byte-equal to the homepage canonical so structured data and canonical signals agree
      { "@type": "ListItem", position: 1, name: matchPreferredLanguage(preferredLanguage, "Home", "Strona główna"), item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  }) as const;

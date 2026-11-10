// services, features, and other libraries
import { absoluteUrl } from "@/features/meta/domain/urls";

// types
import type { PagePath } from "@/domain/models";
import type { ExperienceSeo } from "@/features/meta/domain/models";

// The metadata every indexed document carries; URLs are computed with an explicit language at use
export interface IndexEntry {
  readonly name: string;
  readonly canonical: string;
  readonly mdHref: string;
  readonly summary?: string;
}

// constants
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";

export const pageEntry = (pagePath: PagePath): IndexEntry => ({
  name: STATIC_PAGES[pagePath].label,
  canonical: absoluteUrl(pagePath),
  mdHref: STATIC_PAGES[pagePath].mdHref,
  summary: STATIC_PAGES[pagePath].indexSummary,
});

export const PAGE_ENTRIES: ReadonlyArray<IndexEntry> = STATIC_PAGE_PATHS.map(pageEntry);

export const experienceEntry = (seo: ExperienceSeo): IndexEntry => ({
  name: seo.headline,
  canonical: seo.canonical,
  mdHref: seo.markdownPath,
});

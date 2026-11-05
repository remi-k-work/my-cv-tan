// Router head wrapper: resolves language from the TanStack match chain and handles absent loader data.
// This is a route/infrastructure concern, not a page-head builder, so it lives apart from page-head.
import { PreferredLanguage } from "@/domain/models";
import { NOINDEX_FOLLOW } from "@/domain/http";
import { absoluteUrl } from "./urls";
import { canonicalLink } from "./link-tags";
import { headLanguage } from "./root-head";
import { siteGraphScript } from "./merge";

// constants
import { SITE_DESCRIPTION } from "./constants";

// types
import type { MatchChain, PageHead } from "./models";

// Fallback head when loader data is missing: keeps canonical and noindex while preserving site entities.
export const fallbackHead = (pagePath: string): PageHead => ({
  meta: [
    { name: "robots", content: NOINDEX_FOLLOW },
    { name: "description", content: SITE_DESCRIPTION },
  ],
  links: [canonicalLink(absoluteUrl(pagePath))],
  scripts: [siteGraphScript],
});

// Route head wrapper resolving language from the match chain and handling absent loader data.
export const routeHead = <TData>(
  loaderData: TData,
  matches: MatchChain,
  build: (loaderData: NonNullable<TData>, preferredLanguage: PreferredLanguage) => PageHead,
  fallbackPath: string
): PageHead => (loaderData == null ? fallbackHead(fallbackPath) : build(loaderData, headLanguage(matches)));

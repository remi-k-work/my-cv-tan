// Route adapter for loader-backed heads: resolve locale, suppress stale metadata on failure, and
// leave not-found metadata to the root boundary. Page-specific SEO stays in page-head.

// domain
import { fallbackHead, headLanguage, isNotFoundMatch } from "./root-head";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { MatchChain, PageHead } from "./models";

// constants
export const routeHead = <TData>(
  loaderData: TData,
  matches: MatchChain,
  build: (loaderData: NonNullable<TData>, preferredLanguage: PreferredLanguage) => PageHead,
  fallbackPath: string
): PageHead => {
  // The root route owns not-found metadata, including for a matched route. Do not let a stale
  // loader payload override its noindex fallback with the previous page's canonical or graph.
  if (matches.some(isNotFoundMatch)) return { meta: [], links: [], scripts: [] };

  // One negotiation feeds both the failure fallback and the successful build.
  const preferredLanguage = headLanguage(matches);

  // Failed revalidation can leave loaderData populated. A failure head must not reuse that data.
  if (loaderData == null || matches.some(({ status }) => status === "error")) {
    return fallbackHead(fallbackPath, preferredLanguage);
  }

  return build(loaderData, preferredLanguage);
};

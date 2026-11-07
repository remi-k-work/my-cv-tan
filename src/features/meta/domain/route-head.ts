// The match-chain adapter: the two facts every HTML head reads off TanStack's match chain — the
// negotiated language and whether any match failed — and the generic route head built on them.
// The root route and every leaf route both resolve their language here, so the two cannot disagree
// about which locale a document publishes.

// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";

// domain
import { fallbackHead } from "./fallback";

// constants
import { DEFAULT_LANGUAGE } from "./languages";

// types
import type { PageHead } from "./models";

// TanStack route head match chain providing loader data. It is the router's shape rather than a head
// contract, so it lives with the adapter that reads it instead of beside the head models.
export type MatchChain = ReadonlyArray<{
  readonly loaderData?: unknown;
  readonly status?: "pending" | "success" | "error" | "notFound";
  readonly _notFound?: boolean;
}>;

// The root route's loader is the only one that resolves a language for the document, so every head
// reads it off the first match in the chain. A payload the schema does not accept — a stale
// revalidation, an SSR shell rendered before the loader resolved — degrades to the site default
// rather than throwing inside `head()`.
const decodeRootLoaderData = Schema.decodeUnknownOption(Schema.Struct({ preferredLanguage: PreferredLanguage }));

export const headLanguage = (matches: MatchChain): PreferredLanguage =>
  pipe(
    Array.head(matches),
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage),
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

// A not-found is marked either on the match's status or on the router's internal flag, depending on
// whether the route threw `notFound()` or the loader could not resolve at all.
export const isNotFoundMatch = (match: MatchChain[number]): boolean => match.status === "notFound" || match._notFound === true;

// Route adapter for loader-backed heads: resolve locale, suppress stale metadata on failure, and
// leave not-found metadata to the root boundary. Page-specific SEO stays in page-head.
interface RouteHeadSpec<TData> {
  readonly loaderData: TData;
  readonly matches: MatchChain;
  // The canonical this route publishes when its loader data is missing or stale.
  readonly fallbackPath: string;
  readonly build: (loaderData: NonNullable<TData>, preferredLanguage: PreferredLanguage) => PageHead;
}

export const routeHead = <TData>({ loaderData, matches, fallbackPath, build }: RouteHeadSpec<TData>): PageHead => {
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

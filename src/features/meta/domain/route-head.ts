// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { unavailableHead } from "./fallback";

// types
import type { MatchChain, PageHead, RouteStatus } from "./models";

// Everything one route's head() hands the shared resolver, which decides between a real head, a
// degraded head and an empty one before delegating to the route's own builder
interface RouteHeadSpec<TData> {
  readonly loaderData: TData;
  readonly matches: MatchChain;
  readonly matchStatus: RouteStatus;
  readonly fallbackPath: string;
  readonly build: (loaderData: NonNullable<TData>, preferredLanguage: PreferredLanguage) => PageHead;
}

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";

const decodeRootLoaderData = Schema.decodeUnknownOption(Schema.Struct({ preferredLanguage: PreferredLanguage }));

// TanStack orders the root match first; missing or malformed loader data safely falls back to English
export const headLanguage = (matches: MatchChain): PreferredLanguage =>
  pipe(
    Array.head(matches),
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage),
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

export const isNotFoundMatch = (match: MatchChain[number]): boolean => match.status === "notFound" || match._notFound === true;
const isPendingOrErrorMatch = (match: MatchChain[number]): boolean => match.status === "pending" || match.status === "error";

// A fresh empty head per call keeps callers from sharing (and mutating) one module-level object
const emptyHead = (): PageHead => ({ meta: [], links: [], scripts: [] });

// Builds route head metadata, suppressing stale data on errors and delegating 404s to root
export const routeHead = <TData>({ loaderData, matches, matchStatus, fallbackPath, build }: RouteHeadSpec<TData>): PageHead => {
  // Root boundary owns 404 metadata so stale leaf data cannot overwrite a not-found state
  if (matchStatus === "notFound" || Array.some(matches, isNotFoundMatch)) return emptyHead();

  const preferredLanguage = headLanguage(matches);

  // No metadata built from a stale leaf may outlive an unresolved or failed match in its chain
  if (matchStatus !== "success" || Array.some(matches, isPendingOrErrorMatch)) {
    return unavailableHead(fallbackPath, preferredLanguage);
  }

  return pipe(
    Option.fromNullishOr(loaderData),
    Option.map((data) => build(data, preferredLanguage)),
    Option.getOrElse(() => unavailableHead(fallbackPath, preferredLanguage))
  );
};

// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { fallbackHead } from "./fallback";

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

// Extracts the negotiated preferred language from the root loader match
export const headLanguage = (matches: MatchChain): PreferredLanguage =>
  pipe(
    Array.head(matches),
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage),
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

export const isNotFoundMatch = (match: MatchChain[number]): boolean => match.status === "notFound" || match._notFound === true;

// A not-found route contributes no head of its own: the root boundary owns the failure copy, so a
// stale loader payload can never publish the previous page's canonical or graph over the failure
// A fresh empty head per call keeps callers from sharing (and mutating) one module-level object
const emptyHead = (): PageHead => ({ meta: [], links: [], scripts: [] });

// Builds route head metadata, suppressing stale data on errors and delegating 404s to root
export const routeHead = <TData>({ loaderData, matches, matchStatus, fallbackPath, build }: RouteHeadSpec<TData>): PageHead => {
  if (matchStatus === "notFound" || Array.some(matches, isNotFoundMatch)) return emptyHead();

  const preferredLanguage = headLanguage(matches);

  // A failed or still-pending loader leaves no payload; TanStack hands back either null or
  // undefined for it, so the nullish projection covers both and the builder only ever reads a
  // payload the match actually produced
  const payload = Option.fromNullishOr(loaderData);

  if (matchStatus !== "success" || Option.isNone(payload) || Array.some(matches, ({ status }) => status === "error"))
    return fallbackHead(fallbackPath, preferredLanguage);

  return build(payload.value, preferredLanguage);
};

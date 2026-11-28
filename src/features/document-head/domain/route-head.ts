// services, features, and other libraries
import { Array, Match, Option, Schema, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { unavailableHead } from "./fallback";

// types
import type { PageHead } from "./models";

// The route statuses a TanStack match reports
export type RouteStatus = "pending" | "success" | "error" | "notFound";

// The slice of a TanStack match chain the head resolvers read. `_notFound` is router-private, but
// it is the only signal available when a loader throws notFound()
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown; readonly status?: RouteStatus; readonly _notFound?: boolean }>;

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
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";

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

// One completeness check drives both HTTP and HTML robots directives, so they cannot drift apart
const isIndexableMatchChain = (matches: MatchChain): boolean =>
  matches.length > 1 &&
  Array.every(matches, (match) => match.status === "success" && !isNotFoundMatch(match)) &&
  // Root loader data may still be resolving while headLanguage uses its safe English fallback
  Array.every(Array.drop(matches, 1), ({ loaderData }) => loaderData !== null && loaderData !== undefined);

export const headRobots = (matches: MatchChain) => (isIndexableMatchChain(matches) ? INDEXABLE_ROBOTS : NOINDEX_FOLLOW);

const hasNotFound = (matchStatus: RouteStatus, matches: MatchChain): boolean => matchStatus === "notFound" || Array.some(matches, isNotFoundMatch);

// A fresh empty head per call keeps callers from sharing (and mutating) one module-level object
const emptyHead = (): PageHead => ({ meta: [], links: [], scripts: [] });

// Builds route head metadata, suppressing stale data on errors and delegating 404s to root
export const routeHead = <TData>({ loaderData, matches, matchStatus, fallbackPath, build }: RouteHeadSpec<TData>): PageHead =>
  // Root boundary owns 404 metadata so stale leaf data cannot overwrite a not-found state
  Match.value(hasNotFound(matchStatus, matches)).pipe(
    Match.when(true, emptyHead),
    Match.when(false, () => {
      const preferredLanguage = headLanguage(matches);

      // Guard before Option.map so stale leaf loaderData never builds an indexable head from an incomplete chain
      return pipe(
        Option.fromNullishOr(loaderData),
        Option.filter(() => matchStatus === "success" && isIndexableMatchChain(matches)),
        Option.map((data) => build(data, preferredLanguage)),
        Option.getOrElse(() => unavailableHead(fallbackPath, preferredLanguage))
      );
    }),
    Match.exhaustive
  );

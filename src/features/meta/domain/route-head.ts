// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { fallbackHead } from "./helpers";

// types
import type { MatchChain, PageHead, RouteHeadSpec } from "./models";

// constants
import { EMPTY_PAGE_HEAD } from "./constants";
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

// Builds route head metadata, suppressing stale data on errors and delegating 404s to root
export const routeHead = <TData>({ loaderData, matches, matchStatus, fallbackPath, build }: RouteHeadSpec<TData>): PageHead => {
  if (matchStatus === "notFound" || Array.some(matches, isNotFoundMatch)) return EMPTY_PAGE_HEAD;

  const preferredLanguage = headLanguage(matches);

  if (matchStatus !== "success" || loaderData == null || Array.some(matches, ({ status }) => status === "error"))
    return fallbackHead(fallbackPath, preferredLanguage);

  return build(loaderData, preferredLanguage);
};

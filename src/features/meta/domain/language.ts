// --- Language negotiation for page heads ---

// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";

// constants
import { DEFAULT_LANGUAGE } from "./constants";

// Built once at module scope: the root loader payload is unknown at this boundary, so it is decoded
// as a whole rather than a field read off an `unknown`. The schema rejects anything but the two
// supported languages, which makes a "de" payload a missing locale instead of a throw.
const decodeRootLoaderData = Schema.decodeUnknownOption(Schema.Struct({ preferredLanguage: PreferredLanguage }));

// A route-match chain as head() receives it: TanStack only guarantees the shape, not the payload.
// The root match is always first in the chain, so Array.head is safe and total.
// Exported so shared head builders can type their `matches` input without redeclaring the shape.
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown }>;

// The root route always leads the match chain and its loader resolves the visitor's language, so
// every page head can emit locale-aware tags without extra loader payloads. A malformed payload
// degrades to the site's default language instead of throwing inside head() — and a 404 shell that
// renders before the root loader resolves reads as the default language rather than as `en` by luck.
export const headLanguage = (matches: MatchChain): PreferredLanguage =>
  pipe(
    // The root loader payload sits at match chain index 0; missing or unknown -> None.
    Array.head(matches),
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage),
    // Any failure path (unsupported locale, missing match, malformed payload) lands on the default.
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

// Language resolution for page heads from router match chains.
import { Array, Option, Schema, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";

// constants
import { DEFAULT_LANGUAGE } from "./constants";

// Safely decodes root loader payload containing preferred language.
const decodeRootLoaderData = Schema.decodeUnknownOption(Schema.Struct({ preferredLanguage: PreferredLanguage }));

// Router match chain shape as passed to TanStack head() functions.
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown }>;

// Extracts preferred language from root loader data or falls back to default.
export const headLanguage = (matches: MatchChain): PreferredLanguage =>
  pipe(
    Array.head(matches),
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage),
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

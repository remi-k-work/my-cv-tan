// services, features, and other libraries
import { Array, Option, pipe, Schema } from "effect";
import { PreferredLanguage } from "@/domain/models";

// constants
import { DEFAULT_LANGUAGE } from "./constants";

// The root route always leads the match chain and its loader resolves the visitor's
// language, so every page head can emit locale-aware tags without extra loader payloads
const RootLoaderData = Schema.Struct({
  preferredLanguage: PreferredLanguage,
});

// Built once at module scope: every page head validates the root loader payload through it
const decodeRootLoaderData = Schema.decodeUnknownOption(RootLoaderData);

// Loader data is unknown at this boundary; the schema rejects anything but "en" / "pl"
export const languageFromMatches = (matches: ReadonlyArray<{ readonly loaderData?: unknown }>) =>
  pipe(
    Array.head(matches),
    // `decodeUnknownOption` already yields `None` for nullish input, so no separate guard is needed
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage)
  );

// Total variant for head() call sites: falls back to the site's default language
export const headLanguage = (matches: ReadonlyArray<{ readonly loaderData?: unknown }>) =>
  Option.getOrElse(languageFromMatches(matches), () => DEFAULT_LANGUAGE);

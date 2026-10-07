// services, features, and other libraries
import { Option, pipe, Schema } from "effect";
import { PreferredLanguage } from "@/domain";

// The root route always leads the match chain and its loader resolves the visitor's
// language, so every page head can emit locale-aware tags without extra loader payloads.
const RootLoaderData = Schema.Struct({
  preferredLanguage: PreferredLanguage,
});

// Loader data is unknown at this boundary; the schema rejects anything but "en" / "pl"
export const languageFromMatches = (matches: ReadonlyArray<{ readonly loaderData?: unknown }>) =>
  pipe(
    Option.fromNullishOr(matches[0]?.loaderData),
    Option.flatMap(Schema.decodeUnknownOption(RootLoaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage)
  );

// Total variant for head() call sites: falls back to the site's default language
export const headLanguage = (matches: ReadonlyArray<{ readonly loaderData?: unknown }>) => Option.getOrElse(languageFromMatches(matches), () => "en" as const);

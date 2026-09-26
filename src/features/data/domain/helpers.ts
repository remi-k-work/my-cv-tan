// services, features, and other libraries
import { Effect, Option, Record, Schema, String } from "effect";
import { Cookies, Headers } from "effect/unstable/http";
import { PreferredLanguage } from "@/domain";
import { getCookieEffect, getRequestHeaderEffect } from "@/domain/helpers.server";
import { resolveAcceptLanguage } from "resolve-accept-language";

// constants
import { LANG_COOKIE_NAME } from "@/features/data/domain";

export const getPreferredLanguageFromCookie = Effect.fn("getPreferredLanguageFromCookie")(
  function* (headers: Option.Option<Headers.Headers>) {
    return yield* Option.match(headers, {
      onNone: () => getCookieEffect(LANG_COOKIE_NAME),
      onSome: (headers) => Effect.succeed(Headers.get(headers, "cookie").pipe(Option.map(Cookies.parseHeader), Option.flatMap(Record.get(LANG_COOKIE_NAME)))),
    });
  },
  // Malformed or empty cookie? return None
  Effect.map(Option.flatMap(Schema.decodeUnknownOption(PreferredLanguage)))
);

export const getAcceptLanguageHeader = Effect.fn("getAcceptLanguage")(function* (headers: Option.Option<Headers.Headers>) {
  return yield* Option.match(headers, {
    onNone: () => getRequestHeaderEffect("accept-language"),
    onSome: (headers) => Effect.succeed(Headers.get(headers, "accept-language")),
  });
});

export const resolveAcceptLanguageEffect = Effect.fn("resolveAcceptLanguageEffect")(
  function* (acceptLanguageHeader: Option.Option<string>) {
    return yield* Option.match(acceptLanguageHeader, {
      // Accept-Language header not set? fall back to "en-US"
      onNone: () => Effect.succeed("en-US"),
      onSome: (acceptLanguageHeader) => Effect.sync(() => resolveAcceptLanguage(acceptLanguageHeader, ["en-US", "en-GB", "pl-PL"], "en-US")),
    });
  },
  Effect.map(String.includes("pl")),
  Effect.map((includesPl) => (includesPl ? "pl" : "en"))
);

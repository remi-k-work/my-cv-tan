// services, features, and other libraries
import { Context, Effect, Layer, Option, Record, Schema } from "effect";
import { Cookies, Headers, HttpEffect, HttpServerResponse } from "effect/unstable/http";
import { resolveAcceptLanguage } from "resolve-accept-language";
import { LangError, PreferredLanguage } from "@/domain";

// constants
import { LANG_COOKIE_NAME, LANG_COOKIE_OPTIONS } from "@/features/lang/domain";

export class Lang extends Context.Service<Lang>()("Lang", {
  make: Effect.succeed(() => {
    // Establish the preferred language by the user (try obtaining it from a local cookie first)
    const resolve = Effect.fn("resolve")(
      (headers: Headers.Headers) =>
        // Try obtaining the lang value from a local cookie
        Headers.get(headers, "cookie").pipe(
          Option.map(Cookies.parseHeader),
          Option.flatMap(Record.get(LANG_COOKIE_NAME)),
          Option.match({
            // Otherwise, use the client's preferred language
            onNone: () =>
              Option.match(Headers.get(headers, "accept-language"), {
                // Unrecognized language? use english by default
                onNone: () => Effect.succeed("en"),
                onSome: (acceptLanguageHeader) => {
                  const resolvedLanguage = resolveAcceptLanguage(acceptLanguageHeader, ["en-US", "en-GB", "pl-PL"], "en-US");
                  return Effect.succeed(resolvedLanguage.includes("en") ? "en" : "pl");
                },
              }),
            onSome: (preferredLanguage) => Effect.succeed(preferredLanguage),
          })
        ),
      Effect.andThen(Schema.decodeUnknownEffect(PreferredLanguage)),

      // Unrecognized language? use english by default
      Effect.catchTag("SchemaError", Effect.as("en" as const)),
      Effect.mapError((cause) => new LangError({ cause }))
    );

    const update = Effect.fn("update")((preferredLanguage: PreferredLanguage) =>
      HttpEffect.appendPreResponseHandler((_request, response) =>
        HttpServerResponse.setCookie(response, LANG_COOKIE_NAME, preferredLanguage, LANG_COOKIE_OPTIONS).pipe(Effect.tapError(Effect.logError), Effect.orDie)
      )
    );

    return { resolve, update } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { Headers, HttpEffect, HttpServerResponse } from "effect/http";
import { getAcceptLanguageHeader, getPreferredLanguageFromCookie, resolveAcceptLanguageEffect } from "@/features/data/domain";
import { PreferredLanguage } from "@/domain";

// constants
import { LANG_COOKIE_NAME, LANG_COOKIE_OPTIONS } from "@/features/data/domain";

export class Lang extends Context.Service<Lang>()("Lang", {
  make: Effect.sync(() => {
    // Establish the preferred language by the user
    const resolve = Effect.fn("resolve")(function* (headers: Option.Option<Headers.Headers>) {
      // Try obtaining it from a local cookie first
      const preferredLanguageFromCookie = yield* getPreferredLanguageFromCookie(headers);
      if (Option.isSome(preferredLanguageFromCookie)) return preferredLanguageFromCookie.value;

      // Otherwise, use the client's preferred language
      const acceptLanguageHeader = yield* getAcceptLanguageHeader(headers);
      return yield* resolveAcceptLanguageEffect(acceptLanguageHeader);
    });

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

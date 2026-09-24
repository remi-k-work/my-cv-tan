import "@tanstack/react-start/server-only";

// services, features, and other libraries
import { Effect, Layer } from "effect";
import { HttpEffect, HttpRouter, HttpServer, HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { LangApi } from "./api";

// constants
import { LANG_COOKIE_NAME, LANG_COOKIE_OPTIONS } from "@/features/lang/domain";

const LangApiHandlers = HttpApiBuilder.group(
  LangApi,
  "Lang",
  Effect.fn(function* (handlers) {
    return handlers.handle("lang", ({ payload: { preferredLanguage } }) =>
      HttpEffect.appendPreResponseHandler((_request, response) =>
        HttpServerResponse.setCookie(response, LANG_COOKIE_NAME, preferredLanguage, LANG_COOKIE_OPTIONS).pipe(Effect.tapError(Effect.logError), Effect.orDie)
      ).pipe(Effect.tapError(Effect.logError), Effect.orDie)
    );
  })
);

const LangApiRoutes = HttpApiBuilder.layer(LangApi).pipe(Layer.provide(LangApiHandlers));

export const handler = HttpRouter.toWebHandler(LangApiRoutes.pipe(Layer.provide(HttpServer.layerServices)), { disableLogger: true });

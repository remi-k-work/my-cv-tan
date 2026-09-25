import "@tanstack/react-start/server-only";

// services, features, and other libraries
import { Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Lang } from "@/features/data/services/lang";
import { LangApi } from "./api";

const LangApiHandlers = HttpApiBuilder.group(
  LangApi,
  "Lang",
  Effect.fn(function* (handlers) {
    const { update } = yield* Lang;

    return handlers.handle("lang", ({ payload: { preferredLanguage } }) => update(preferredLanguage));
  })
).pipe(Layer.provide(Lang.layer));

const LangApiRoutes = HttpApiBuilder.layer(LangApi).pipe(Layer.provide(LangApiHandlers));

export const handler = HttpRouter.toWebHandler(LangApiRoutes.pipe(Layer.provide(HttpServer.layerServices)), { disableLogger: true });

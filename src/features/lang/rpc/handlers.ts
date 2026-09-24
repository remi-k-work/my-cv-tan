import "@tanstack/react-start/server-only";

// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { HttpServer, HttpRouter } from "effect/unstable/http";
import { RpcLang } from "./requests";
import { Lang } from "@/features/lang/services/lang";
import { RpcLoggerLive } from "@/services/rpc-logger";

const RpcLangLayer = RpcLang.toLayer({
  resolve: (_, { headers }) =>
    Effect.gen(function* () {
      const { resolve } = yield* Lang;
      return yield* resolve(headers);
    }),
}).pipe(Layer.provide(Lang.layer));

const RpcLayer = RpcServer.layerHttp({
  group: RpcLang,
  path: "/api/rpc/lang",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcLangLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLoggerLive)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });

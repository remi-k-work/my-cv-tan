// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { HttpServer, HttpRouter } from "effect/unstable/http";
import { RpcMain } from "./requests";

const RpcMainLayer = RpcMain.toLayer({
  isCaptchaValid: ({ captchaInput }) =>
    Effect.gen(function* () {
      yield* Effect.sleep(1000);
      return yield* Effect.succeed(captchaInput === "123456");
    }),
});

const RpcLayer = RpcServer.layerHttp({
  group: RpcMain,
  path: "/api/rpc",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcMainLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });

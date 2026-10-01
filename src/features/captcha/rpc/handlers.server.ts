// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcSerialization, RpcServer } from "effect/rpc";
import { HttpServer, HttpRouter } from "effect/http";
import { RpcCaptcha } from "./requests";
import { Captcha } from "@/features/captcha/services/captcha";
import { RpcLoggerLive } from "@/services/rpc-logger";

const RpcCaptchaLayer = RpcCaptcha.toLayer({
  isCaptchaValid: ({ captchaInput }, { headers }) =>
    Effect.gen(function* () {
      const { verify } = yield* Captcha;
      return yield* verify(headers, captchaInput);
    }),
}).pipe(Layer.provide(Captcha.layer));

const RpcLayer = RpcServer.layerHttp({
  group: RpcCaptcha,
  path: "/api/rpc/captcha",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcCaptchaLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLoggerLive)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });

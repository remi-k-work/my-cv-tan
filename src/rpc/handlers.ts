import "@tanstack/react-start/server-only";

// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { HttpServer, HttpRouter } from "effect/unstable/http";
import { RpcMain } from "./requests";
import { Captcha } from "@/features/captcha/services/captcha";
import { RpcLoggerLive } from "@/services/rpc-logger";

const RpcMainLayer = RpcMain.toLayer({
  isCaptchaValid: ({ captchaInput }) =>
    Effect.gen(function* () {
      // Check the captcha solution stored in the sealed session cookie
      yield* Effect.log({ captchaInput });
      // const { getCaptchaString } = yield* Captcha;
      return yield* Effect.succeed(false);
      // return yield* Effect.succeed(captchaInput === getCaptchaString);
    }),

  // contactForm: ({ name, email, subject, message }) =>
  //   Effect.gen(function* () {
  //     yield* Effect.sleep(1000);
  //     yield* Effect.log({ name, email, subject, message });
  //   }),
}).pipe(Layer.provide(Captcha.layer));

const RpcLayer = RpcServer.layerHttp({
  group: RpcMain,
  path: "/api/rpc",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcMainLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLoggerLive)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });

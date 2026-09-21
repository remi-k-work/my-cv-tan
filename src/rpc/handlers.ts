import "@tanstack/react-start/server-only";

// services, features, and other libraries
import { Effect, Layer, Option } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { HttpServer, HttpRouter } from "effect/unstable/http";
import { RpcMain } from "./requests";
import { getCaptchaStringFromHeaders } from "@/features/captcha/domain";
import { Send } from "@/features/contact-me/services/send";
import { RpcLoggerLive } from "@/services/rpc-logger";

const RpcMainLayer = RpcMain.toLayer({
  isCaptchaValid: ({ captchaInput }, { headers }) =>
    Effect.gen(function* () {
      // Check the captcha against the sealed cookie set by the HttpApi captcha endpoint
      const expected = yield* getCaptchaStringFromHeaders(headers);
      return Option.isSome(expected) && expected.value === captchaInput;
    }),
  contactForm: ({ name, email, subject, message }) =>
    Effect.gen(function* () {
      // Send the contact form with validated data
      const { send } = yield* Send;
      yield* Effect.void;
      // yield* send(name, email, subject, message);
    }),
}).pipe(Layer.provide(Send.layer));

const RpcLayer = RpcServer.layerHttp({
  group: RpcMain,
  path: "/api/rpc",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcMainLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLoggerLive)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });

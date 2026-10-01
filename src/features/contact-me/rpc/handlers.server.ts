// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { HttpServer, HttpRouter } from "effect/unstable/http";
import { RpcContactMe } from "./requests";
import { Send } from "@/features/contact-me/services/send";
import { RpcLoggerLive } from "@/services/rpc-logger";

const RpcContactMeLayer = RpcContactMe.toLayer({
  contactForm: ({ name, email, subject, message }) =>
    Effect.gen(function* () {
      // Send the contact form with validated data
      const { send } = yield* Send;
      yield* send(name, email, subject, message);
    }),
}).pipe(Layer.provide(Send.layer));

const RpcLayer = RpcServer.layerHttp({
  group: RpcContactMe,
  path: "/api/rpc/contact-me",
  protocol: "http",
  disableFatalDefects: true,
  disableTracing: true,
}).pipe(Layer.provide(Layer.mergeAll(RpcContactMeLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLoggerLive)));

export const handler = HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });

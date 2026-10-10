// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcContactMe } from "./requests";
import { Send } from "@/features/contact-me/services/send";
import { makeRpcHandler } from "@/domain/helpers";

const RpcContactMeLayer = RpcContactMe.toLayer({
  contactForm: ({ name, email, subject, message }) =>
    Effect.gen(function* () {
      // Send the contact form with validated data
      const { send } = yield* Send;
      yield* send(name, email, subject, message);
    }),
}).pipe(Layer.provide(Send.layer));

export const handler = makeRpcHandler(RpcContactMe, "/api/rpc/contact-me", RpcContactMeLayer);

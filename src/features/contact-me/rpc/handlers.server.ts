// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcContactMe } from "./requests";
import { Send } from "@/features/contact-me/services/send";
import { Captcha } from "@/features/captcha/services/captcha";
import { CaptchaError } from "@/domain/errors";
import { makeRpcHandler } from "@/domain/helpers";

const RpcContactMeLayer = RpcContactMe.toLayer({
  // Re-verify the captcha against the signed cookie before sending: the client-side refine is only
  // a convenience, since the RPC itself is reachable without going through the form
  contactForm: Effect.fnUntraced(function* ({ name, email, subject, message, captchaInput }, { headers }) {
    // The handler only invokes the mail operation after the gate succeeds, so a rejected answer
    // never sends a request to EmailJS; the Send service itself is initialized with this layer
    const { verify } = yield* Captcha;
    if (!(yield* verify(headers, captchaInput))) return yield* new CaptchaError({ cause: "Captcha verification failed" });

    const { send } = yield* Send;
    return yield* send(name, email, subject, message);
  }),
}).pipe(Layer.provide([Send.layer, Captcha.layer]));

export const handler = makeRpcHandler(RpcContactMe, "/api/rpc/contact-me", RpcContactMeLayer);

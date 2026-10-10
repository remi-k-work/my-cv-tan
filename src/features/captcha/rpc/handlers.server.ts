// services, features, and other libraries
import { Effect, Layer } from "effect";
import { RpcCaptcha } from "./requests";
import { Captcha } from "@/features/captcha/services/captcha";
import { makeRpcHandler } from "@/domain/helpers";

const RpcCaptchaLayer = RpcCaptcha.toLayer({
  isCaptchaValid: ({ captchaInput }, { headers }) =>
    Effect.gen(function* () {
      const { verify } = yield* Captcha;
      return yield* verify(headers, captchaInput);
    }),
}).pipe(Layer.provide(Captcha.layer));

export const handler = makeRpcHandler(RpcCaptcha, "/api/rpc/captcha", RpcCaptchaLayer);

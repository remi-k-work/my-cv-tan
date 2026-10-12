// services, features, and other libraries
import { Effect, Layer } from "effect";
import { HttpEffect, HttpRouter, HttpServer, HttpServerResponse } from "effect/http";
import { HttpApiBuilder, HttpApiSchema } from "effect/http-api";
import { createCaptchaSvg } from "@/features/captcha/domain";
import { Captcha } from "@/features/captcha/services/captcha";
import { CaptchaApi } from "./api";

// constants
import { CAPTCHA_COOKIE_NAME, CAPTCHA_COOKIE_OPTIONS } from "@/features/captcha/domain";

const CaptchaApiHandlers = HttpApiBuilder.group(
  CaptchaApi,
  "Captcha",
  Effect.fn("CaptchaApiHandlers")(function* (handlers) {
    const { generate, seal } = yield* Captcha;

    return handlers.handle(
      "captcha",
      Effect.fnUntraced(
        function* () {
          const captchaString = yield* generate;
          const sealed = yield* seal(captchaString);
          yield* HttpEffect.appendPreResponseHandler((_request, response) =>
            HttpServerResponse.setCookie(response, CAPTCHA_COOKIE_NAME, sealed, CAPTCHA_COOKIE_OPTIONS).pipe(Effect.tapError(Effect.logError), Effect.orDie)
          );
          const svg = yield* createCaptchaSvg(captchaString);
          return HttpApiSchema.withHeaders({ body: svg, headers: { "Cache-Control": "private, no-store" as const } });
        },
        Effect.tapError(Effect.logError),
        Effect.orDie
      )
    );
  })
).pipe(Layer.provide(Captcha.layer));

const CaptchaApiRoutes = HttpApiBuilder.layer(CaptchaApi).pipe(Layer.provide(CaptchaApiHandlers));

export const handler = HttpRouter.toWebHandler(CaptchaApiRoutes.pipe(Layer.provide(HttpServer.layerServices)), { disableLogger: true });

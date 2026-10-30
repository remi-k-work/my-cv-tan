// services, features, and other libraries
import { Effect, Layer } from "effect";
import { HttpEffect, HttpRouter, HttpServer, HttpServerResponse } from "effect/http";
import { HttpApiBuilder, HttpApiSchema } from "effect/http-api";
import { createCaptchaSvg } from "@/features/captcha/domain/helpers";
import { Captcha } from "@/features/captcha/services/captcha";
import { CaptchaApi } from "./api";

// constants
import { CAPTCHA_COOKIE_NAME, CAPTCHA_COOKIE_OPTIONS } from "@/features/captcha/domain/constants";

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

          // Sealing the cookie and rendering the SVG are independent, so run them together
          const [sealed, svg] = yield* Effect.all([seal(captchaString), createCaptchaSvg(captchaString)], { concurrency: "unbounded" });
          yield* HttpEffect.appendPreResponseHandler((_request, response) =>
            HttpServerResponse.setCookie(response, CAPTCHA_COOKIE_NAME, sealed, CAPTCHA_COOKIE_OPTIONS).pipe(
              // A cookie failure must not break the captcha response: log it and keep the response
              Effect.catchTag("CookiesError", (error) => Effect.logError("[CAPTCHA]: failed to set captcha cookie", error).pipe(Effect.as(response)))
            )
          );
          return HttpApiSchema.withHeaders({ body: svg, headers: { "Cache-Control": "private, no-store" as const } });
        },
        // Sealing failures are a real error condition (bad seal, missing entropy), not a reason to
        // kill the connection: log with context and answer with a 500 instead of terminating abruptly
        Effect.catchTag("CaptchaError", (error) =>
          Effect.logError("[CAPTCHA]: captcha sealing failed", error).pipe(
            Effect.as(HttpServerResponse.text("Captcha temporarily unavailable", { status: 500 }))
          )
        )
      )
    );
  })
).pipe(Layer.provide(Captcha.layer));

const CaptchaApiRoutes = HttpApiBuilder.layer(CaptchaApi).pipe(Layer.provide(CaptchaApiHandlers));

export const handler = HttpRouter.toWebHandler(CaptchaApiRoutes.pipe(Layer.provide(HttpServer.layerServices)), { disableLogger: true });

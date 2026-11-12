// services, features, and other libraries
import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";

// constants
import { CAPTCHA_CACHE_CONTROL } from "@/features/captcha/domain/constants";

const CaptchaSvg = Schema.String.pipe(HttpApiSchema.asText({ contentType: "image/svg+xml" }));

const CaptchaSuccess = HttpApiSchema.WithHeaders(CaptchaSvg, {
  "Cache-Control": Schema.Literal(CAPTCHA_CACHE_CONTROL),
});

class CaptchaApiGroup extends HttpApiGroup.make("Captcha")
  .add(HttpApiEndpoint.get("captcha", "/captcha", { success: CaptchaSuccess }))
  .prefix("/api") {}

export class CaptchaApi extends HttpApi.make("CaptchaApi").add(CaptchaApiGroup) {}

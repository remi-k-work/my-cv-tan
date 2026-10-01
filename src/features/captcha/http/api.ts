// services, features, and other libraries
import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";

const CaptchaSvg = Schema.String.pipe(HttpApiSchema.asText({ contentType: "image/svg+xml" }));

const CaptchaSuccess = HttpApiSchema.WithHeaders(CaptchaSvg, {
  "Cache-Control": Schema.Literal("private, no-store"),
});

class CaptchaApiGroup extends HttpApiGroup.make("Captcha")
  .add(HttpApiEndpoint.get("captcha", "/captcha", { success: CaptchaSuccess }))
  .prefix("/api") {}

export class CaptchaApi extends HttpApi.make("CaptchaApi").add(CaptchaApiGroup) {}

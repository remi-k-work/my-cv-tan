// services, features, and other libraries
import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";

const CaptchaSvg = Schema.String.pipe(HttpApiSchema.asText({ contentType: "image/svg+xml" }));

const CaptchaSuccess = HttpApiSchema.WithHeaders(CaptchaSvg, {
  "Cache-Control": Schema.Literal("private, no-store"),
});

class AppApiGroup extends HttpApiGroup.make("App")
  .add(HttpApiEndpoint.get("captcha", "/app", { success: CaptchaSuccess }))
  .prefix("/api") {}

export class AppApi extends HttpApi.make("AppApi").add(AppApiGroup) {}

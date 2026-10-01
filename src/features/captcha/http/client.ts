// services, features, and other libraries
import { Context, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";
import { CaptchaApi } from "./api";

export class CaptchaApiClient extends Context.Service<CaptchaApiClient, HttpApiClient.ForApi<typeof CaptchaApi>>()("CaptchaApiClient", {
  make: HttpApiClient.make(CaptchaApi),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(FetchHttpClient.layer));
}

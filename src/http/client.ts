// services, features, and other libraries
import { Context, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { HttpApiClient } from "effect/unstable/httpapi";
import { AppApi } from "./api";

export class AppApiClient extends Context.Service<AppApiClient, HttpApiClient.ForApi<typeof AppApi>>()("AppApiClient", {
  make: HttpApiClient.make(AppApi),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(FetchHttpClient.layer));
}

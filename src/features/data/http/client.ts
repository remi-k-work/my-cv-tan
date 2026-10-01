// services, features, and other libraries
import { Context, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";
import { LangApi } from "./api";

export class LangApiClient extends Context.Service<LangApiClient, HttpApiClient.ForApi<typeof LangApi>>()("LangApiClient", {
  make: HttpApiClient.make(LangApi),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(FetchHttpClient.layer));
}

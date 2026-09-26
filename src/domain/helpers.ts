// services, features, and other libraries
import { Config, Context, Effect, Layer, Match, Option } from "effect";
import { RpcClient, RpcGroup, RpcSerialization } from "effect/unstable/rpc";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/unstable/http";

// types
import type { Rpc } from "effect/unstable/rpc";
import type { PreferredLanguage } from ".";

const getBaseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

const CorsClientLayer = FetchHttpClient.layer.pipe(Layer.provide(Layer.succeed(FetchHttpClient.RequestInit, { credentials: "include" })));

// Builds a class-style RPC client service backed by an HTTP protocol layer for a given RPC group
export const makeRpcClient = <Rpcs extends Rpc.Any>(serviceName: string, group: RpcGroup.RpcGroup<Rpcs>, path: string) => {
  const ProtocolLive = Layer.unwrap(
    Effect.gen(function* () {
      const websiteUrl = yield* Config.option(Config.String("WEBSITE_URL"));

      return RpcClient.layerProtocolHttp({
        url: new URL(path, getBaseUrl).href,
        // url: Option.map(websiteUrl, (websiteUrl) => new URL(path, websiteUrl).href).pipe(Option.getOrElse(() => path)),
      }).pipe(Layer.provide([CorsClientLayer, RpcSerialization.layerSchemaBinary()]));
    })
  );

  return class extends Context.Service<RpcClient.RpcClient<Rpcs>>()(serviceName, {
    make: RpcClient.make(group, { disableTracing: true }),
  }) {
    static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(ProtocolLive));
  };
};

export const matchPreferredLanguage = <T>(preferredLanguage: PreferredLanguage, en: T, pl: T): T =>
  Match.value(preferredLanguage).pipe(
    Match.when("en", () => en),
    Match.when("pl", () => pl),
    Match.exhaustive
  ) as T;

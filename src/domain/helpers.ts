// services, features, and other libraries
import { Context, Layer, Option, pipe } from "effect";
import { RpcClient, RpcGroup, RpcSerialization } from "effect/rpc";
import { FetchHttpClient } from "effect/http";

// types
import type { Rpc } from "effect/rpc";
import type { PagePath, PageTitles, PreferredLanguage } from "./models";

// Builds a class-style RPC client service backed by an HTTP protocol layer for a given RPC group
export const makeRpcClient = <Rpcs extends Rpc.Any>(serviceName: string, group: RpcGroup.RpcGroup<Rpcs>, path: string) => {
  const ProtocolLive = RpcClient.layerProtocolHttp({ url: path }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerSchemaBinary()]));

  return class extends Context.Service<RpcClient.RpcClient<Rpcs>>()(serviceName, {
    make: RpcClient.make(group, { disableTracing: true }),
  }) {
    static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(ProtocolLive));
  };
};

export const matchPreferredLanguage = <T>(preferredLanguage: PreferredLanguage, en: T, pl: T): T => (preferredLanguage === "en" ? en : pl);

// Localized page title/intro with a static fallback when loader data is missing or partial
export const pageField = (pageTitles: PageTitles | null, pagePath: PagePath, key: "heading" | "intro", fallback: string) =>
  pipe(
    Option.fromNullishOr(pageTitles),
    Option.flatMap((titles) => Option.fromNullishOr(titles[pagePath])),
    Option.map((page) => page[key]),
    Option.getOrElse(() => fallback)
  );

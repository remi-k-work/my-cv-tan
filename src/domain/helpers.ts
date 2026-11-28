// services, features, and other libraries
import { Context, Layer, Option, pipe } from "effect";
import { RpcClient, RpcGroup, RpcSerialization, RpcServer } from "effect/rpc";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/http";
import { RpcLogger } from "@/services/rpc-logger";
import { decodePreferredLanguage } from "./models";

// types
import type { Rpc } from "effect/rpc";
import type { PreferredLanguage, Translate } from "./models";

// constants
import { DEFAULT_LANGUAGE } from "./constants";

// Builds a class-style RPC client service backed by an HTTP protocol layer for a given RPC group
export const makeRpcClient = <Rpcs extends Rpc.Any>(serviceName: string, group: RpcGroup.RpcGroup<Rpcs>, path: string) => {
  const ProtocolLive = RpcClient.layerProtocolHttp({ url: path }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerSchemaBinary()]));

  return class extends Context.Service<RpcClient.RpcClient<Rpcs>>()(serviceName, {
    make: RpcClient.make(group, { disableTracing: true }),
  }) {
    static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(ProtocolLive));
  };
};

// Builds the web handler for an RPC group's HTTP route
export const makeRpcHandler = <Rpcs extends Rpc.Any, LE>(
  group: RpcGroup.RpcGroup<Rpcs>,
  path: HttpRouter.PathInput,
  handlersLayer: Layer.Layer<Rpc.ToHandler<Rpcs> | Rpc.ServicesServer<Rpcs>, LE, never>
) => {
  const RpcLayer = RpcServer.layerHttp({
    group,
    path,
    protocol: "http",
    disableFatalDefects: true,
    disableTracing: true,
  }).pipe(Layer.provide(Layer.mergeAll(handlersLayer, RpcSerialization.layerSchemaBinary(), HttpServer.layerServices, RpcLogger.layer)));

  return HttpRouter.toWebHandler(RpcLayer, { disableLogger: true });
};

// Adapts an HttpRouter web handler to TanStack Start's server route-handler shape, which receives the request wrapped in a context object
export const routeHandler =
  (webHandler: { readonly handler: (request: Request) => Response | Promise<Response> }) =>
  ({ request }: { request: Request }) =>
    webHandler.handler(request);

// Selects the branch for the resolved language
export const matchPreferredLanguage = <T>(preferredLanguage: PreferredLanguage, en: T, pl: T): T => (preferredLanguage === "pl" ? pl : en);

// Normalizes any locale string a caller can hand us onto the site's supported languages
export const preferredLanguageFromLocale = (locale: string): PreferredLanguage =>
  pipe(
    decodePreferredLanguage(locale),
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

export const translateSource: Translate = (source) => source;

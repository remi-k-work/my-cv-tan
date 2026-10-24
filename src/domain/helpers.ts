// services, features, and other libraries
import { Context, Layer, Option, pipe } from "effect";
import { RpcClient, RpcGroup, RpcSerialization, RpcServer } from "effect/rpc";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/http";
import { RpcLogger } from "@/services/rpc-logger";

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

// Builds the web handler for an RPC group's HTTP route. disableFatalDefects serializes defects
// as an Exit instead of closing the connection; disableTracing is deliberate (no tracer configured)
// The handlers layer claims Rpc.ServicesServer too: the schema services those requirements resolve
// to for a concrete group are already covered, and the claim is checked at each call site
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

// Adapts an HttpRouter web handler to TanStack Start's server route-handler shape,
// which receives the request wrapped in a context object
export const routeHandler =
  (webHandler: { readonly handler: (request: Request) => Response | Promise<Response> }) =>
  ({ request }: { request: Request }) =>
    webHandler.handler(request);

export const matchPreferredLanguage = <T>(preferredLanguage: PreferredLanguage, en: T, pl: T): T => (preferredLanguage === "en" ? en : pl);

// Localized page title/intro with a static fallback when loader data is missing or partial
export const pageField = (pageTitles: PageTitles | null, pagePath: PagePath, key: "heading" | "intro", fallback: string) =>
  pipe(
    Option.fromNullishOr(pageTitles),
    Option.flatMapNullishOr((titles) => titles[pagePath]),
    Option.map((page) => page[key]),
    Option.getOrElse(() => fallback)
  );

// services, features, and other libraries
import { Context, Layer, Option, pipe, String } from "effect";
import { RpcClient, RpcGroup, RpcSerialization } from "effect/rpc";
import { FetchHttpClient } from "effect/http";

// types
import type { Rpc } from "effect/rpc";
import type { PreferredLanguage } from "./models";

// constants
import { EXCERPT_SUFFIX } from "./constants";

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

export const excerpt = (text: string, maxLength: number) => {
  // Return early if text fits within limits
  if (String.length(text) <= maxLength) return text;

  // Take the first maxLength characters from the left
  const cut = pipe(text, String.takeLeft(maxLength));

  // Find last word boundary using Option
  const wordBoundedText = pipe(
    cut,
    String.lastIndexOf(" "),
    Option.filter((index) => index > 0),
    Option.map((index) => pipe(cut, String.takeLeft(index))),
    Option.getOrElse(() => cut)
  );

  return `${String.trimEnd(wordBoundedText)}${EXCERPT_SUFFIX}`;
};

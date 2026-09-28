// services, features, and other libraries
import { Context, Layer, Match } from "effect";
import { RpcClient, RpcGroup, RpcSerialization } from "effect/unstable/rpc";
import { FetchHttpClient } from "effect/unstable/http";

// types
import type { Rpc } from "effect/unstable/rpc";
import type { PreferredLanguage } from ".";

// constants
import { EXCERPT_SUFFIX } from ".";

// Builds a class-style RPC client service backed by an HTTP protocol layer for a given RPC group
export const makeRpcClient = <Rpcs extends Rpc.Any>(serviceName: string, group: RpcGroup.RpcGroup<Rpcs>, path: string) => {
  const ProtocolLive = RpcClient.layerProtocolHttp({ url: path }).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerSchemaBinary()]));

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

// A helper function to split text while respecting word boundaries
export function chunkTextByWords(text: string, maxLength: number) {
  const chunks: string[] = [];
  // First, split the entire text into individual words
  const words = text.split(" ");
  let currentChunk = "";

  for (const word of words) {
    // If adding the next word doesn't exceed the max length, add it
    if ((currentChunk + " " + word).length <= maxLength) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      // Otherwise, push the current chunk to the array and start a new one
      chunks.push(currentChunk);
      currentChunk = word;
    }
  }

  // Add the last remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function excerpt(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}${EXCERPT_SUFFIX}`;
}

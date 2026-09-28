// services, features, and other libraries
import { Array, Context, Layer, Match, Option, pipe, String } from "effect";
import { RpcClient, RpcGroup, RpcSerialization } from "effect/unstable/rpc";
import { FetchHttpClient } from "effect/unstable/http";

// types
import type { Rpc } from "effect/unstable/rpc";
import type { PreferredLanguage } from ".";

interface ChunkAcc {
  readonly chunks: ReadonlyArray<string>;
  readonly current: string;
}

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
export const chunkTextByWords = (text: string, maxLength: number) => {
  // Sanitize input and split into non-empty words
  const words = pipe(text, String.split(/\s+/), Array.filter(String.isNonEmpty));

  // Reduce words into immutable chunks
  const initialState: ChunkAcc = { chunks: [], current: "" };

  // Reduce words into chunks
  const { chunks, current } = pipe(
    words,
    Array.reduce(initialState, (acc, word) => {
      // If no active chunk, start one with the current word
      if (String.isEmpty(acc.current)) return { ...acc, current: word };

      const nextCandidate = `${acc.current} ${word}`;

      // Append word if it fits within maxLength
      if (String.length(nextCandidate) <= maxLength) return { ...acc, current: nextCandidate };

      // Otherwise push current chunk and start a new chunk
      return { chunks: Array.append(acc.chunks, acc.current), current: word };
    })
  );

  // Flush the final chunk into the array and return the completed array
  return String.isEmpty(current) ? chunks : Array.append(chunks, current);
};

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

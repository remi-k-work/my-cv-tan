// services, features, and other libraries
import { Data } from "effect";

// types
export interface ChunkAcc {
  readonly chunks: ReadonlyArray<string>;
  readonly current: string;
}

export type TypewriterOp = Data.TaggedEnum<{
  readonly TypeChars: { readonly text: string };
  readonly DeleteChars: { readonly count: number };
  readonly Pause: { readonly millis: number };
}>;

export const { TypeChars, DeleteChars, Pause } = Data.taggedEnum<TypewriterOp>();

// services, features, and other libraries
import { Array, Effect, pipe, Random, String } from "effect";

// types
import type { ChunkAcc } from "./models";

// constants
import { LOWERCASE_LETTERS } from "./constants";

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

// Length of a text in user-visible characters (Unicode code points); typing emits one frame
// per code point, so delete counts must be measured in the same unit to stay aligned; using
// `String.length` would split surrogate pairs and delete past the intended word
export const charCount = (text: string) => Array.length(Array.fromIterable(text));

// A random lowercase letter used for insertion typos
export const randomLetter = Effect.map(Random.nextIntBetween(0, String.length(LOWERCASE_LETTERS) - 1), (index) => LOWERCASE_LETTERS[index]);

// services, features, and other libraries
import { Array, Effect, Match, pipe, Random, String } from "effect";

// types
import type { ChunkAcc, TypewriterFrame, TypewriterOp } from "./models";

// constants
import { DELETING_SPEED, TYPING_SPEED } from "./constants";

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

// Expands a single script op into the timed frames it produces, starting from
// the currently visible text. Typing and deleting emit one frame per
// character with a human-like hold; a pause re-emits the unchanged text after
// its hold so the pause actually elapses inside the stream.
export const expandOp = (currText: string, typewriterOp: TypewriterOp) =>
  Match.valueTags(typewriterOp, {
    TypeChars: ({ text }) =>
      Effect.gen(function* () {
        const frames: Array<TypewriterFrame> = [];
        let typed = currText;

        for (const char of text) {
          const holdMillis = yield* Random.nextIntBetween(60, TYPING_SPEED);
          typed += char;
          frames.push({ text: typed, holdMillis });
        }

        return frames;
      }),
    DeleteChars: ({ count }) =>
      Effect.gen(function* () {
        const frames: Array<TypewriterFrame> = [];
        let typed = currText;

        for (let i = 0; i < count && typed.length > 0; i++) {
          const holdMillis = yield* Random.nextIntBetween(60, DELETING_SPEED);
          typed = typed.slice(0, -1);
          frames.push({ text: typed, holdMillis });
        }

        return frames;
      }),
    Pause: ({ millis }) => Effect.succeed([{ text: currText, holdMillis: millis }]),
  });

// A pure reducer applying a single animation op to the currently visible text
export const applyOp = (currText: string, typewriterOp: TypewriterOp) =>
  Match.valueTags(typewriterOp, {
    TypeChars: ({ text: typed }) => `${currText}${typed}`,
    DeleteChars: ({ count }) => (count <= 0 ? currText : count >= String.length(currText) ? "" : currText.slice(0, currText.length - count)),
    Pause: () => currText,
  });

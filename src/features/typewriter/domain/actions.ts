// services, features, and other libraries
import { Array, Effect, Random, String, pipe } from "effect";
import { charCount, randomLetter } from "./helpers";

// types
import type { TypewriterOp } from "./models";

// constants
import { TYPO_PROBABILITY } from "./constants";
import { DeleteChars, Pause, TypeChars } from "./models";

// Simulates a human typo for a single word; an adjacent-character swap, a skipped character, or an inserted random lowercase letter
export const planTypo = Effect.fnUntraced(function* (word: string): Effect.fn.Return<string> {
  const chars = Array.fromIterable(word);
  const result: Array<string> = [];
  let i = 0;

  while (i < chars.length) {
    // Most characters pass through untouched
    if ((yield* Random.next) >= TYPO_PROBABILITY) {
      result.push(chars[i]);
      i += 1;
      continue;
    }

    const roll = yield* Random.next;

    // Swap with the adjacent character, consuming both
    if (roll < 0.33 && i < chars.length - 1) {
      result.push(chars[i + 1], chars[i]);
      i += 2;
      continue;
    }

    // Skip the character
    if (roll < 0.66) {
      i += 1;
      continue;
    }

    // Insert a random lowercase letter after the character
    result.push(chars[i], yield* randomLetter);
    i += 1;
  }

  return Array.join(result, "");
});

// Plans the script for one word: either type it straight away, or type the typo, pause, delete it, then type the correct word
const planWord = Effect.fnUntraced(function* (word: string, typo: (word: string) => Effect.Effect<string>): Effect.fn.Return<ReadonlyArray<TypewriterOp>> {
  const typoWord = yield* typo(word);
  const pauseAfterWord = yield* Random.nextIntBetween(60, 100);

  if (word === typoWord) return [TypeChars({ text: `${word} ` }), Pause({ millis: pauseAfterWord })];

  const pauseAfterTypo = yield* Random.nextIntBetween(60, 250);
  return [
    TypeChars({ text: `${typoWord} ` }),
    Pause({ millis: pauseAfterTypo }),
    DeleteChars({ count: charCount(typoWord) + 1 }),
    TypeChars({ text: `${word} ` }),
    Pause({ millis: pauseAfterWord }),
  ];
});

// Plans the full animation script for a text; type each word, and when the typo simulation alters a word, type the typo, pause, delete it
// then type the correct word; the `typo` step is injectable so tests can force exact scenarios without depending on randomness
export const planScript = (fullText: string, typo: (word: string) => Effect.Effect<string> = planTypo): Effect.Effect<ReadonlyArray<TypewriterOp>> =>
  pipe(
    fullText,
    String.split(" "),
    Array.filter(String.isNonEmpty),
    Effect.forEach((word) => planWord(word, typo)),
    Effect.map(Array.flatten)
  );

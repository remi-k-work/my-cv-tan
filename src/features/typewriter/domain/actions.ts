// services, features, and other libraries
import { Array, Effect, Random } from "effect";

// types
import type { TypewriterOp } from "./models";

// constants
import { TYPO_PROBABILITY } from "./constants";
import { DeleteChars, Pause, TypeChars } from "./models";

// Simulates a human typo for a single word; adjacent-character swap, skipped character, or an inserted random lowercase letter
export const planTypo = Effect.fnUntraced(function* (word: string): Effect.fn.Return<string> {
  let result = "";
  let i = 0;

  while (i < word.length) {
    const char = word[i];

    if ((yield* Random.next) < TYPO_PROBABILITY) {
      const randomAction = yield* Random.next;

      if (randomAction < 0.33 && i < word.length - 1) {
        // Swap with the adjacent character, consuming both
        result += word[i + 1] + char;
        i += 2;
        continue;
      } else if (randomAction < 0.66) {
        // Skip the character
        i += 1;
        continue;
      } else {
        // Insert a random lowercase letter after the character
        const code = yield* Random.nextIntBetween(97, 122);
        result += char + String.fromCharCode(code);
      }
    } else {
      result += char;
    }

    i += 1;
  }

  return result;
});

// Plans the full animation script for a text: type each word, and when the
// typo simulation alters a word, type the typo, pause, delete it, then type
// the correct word. The `typo` step is injectable so tests can force exact
// scenarios without depending on randomness.
export const planScript = Effect.fnUntraced(function* (
  fullText: string,
  typo: (word: string) => Effect.Effect<string> = planTypo
): Effect.fn.Return<ReadonlyArray<TypewriterOp>> {
  const words = fullText.split(" ");

  const typewriterOps = yield* Effect.forEach(words, (word) =>
    Effect.gen(function* () {
      const typoWord = yield* typo(word);
      const pauseAfterWord = yield* Random.nextIntBetween(60, 100);

      if (word === typoWord) return [TypeChars({ text: `${word} ` }), Pause({ millis: pauseAfterWord })];

      const pauseAfterTypo = yield* Random.nextIntBetween(60, 250);
      return [
        TypeChars({ text: `${typoWord} ` }),
        Pause({ millis: pauseAfterTypo }),
        DeleteChars({ count: typoWord.length + 1 }),
        TypeChars({ text: `${word} ` }),
        Pause({ millis: pauseAfterWord }),
      ];
    })
  );

  return Array.flatten(typewriterOps);
});

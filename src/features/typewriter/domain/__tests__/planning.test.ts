// services, features, and other libraries
import { assert, describe, it } from "@effect/vitest";
import { Effect, Random } from "effect";

// domain
import { planScript, planTypo } from "../actions";
import { DeleteChars, TypeChars } from "../models";

describe("planTypo", () => {
  it.effect("leaves the word untouched without a typo roll", () =>
    Effect.gen(function* () {
      assert.strictEqual(yield* planTypo("hello").pipe(Random.withSeed("seed-1")), "hello");
    })
  );

  it.effect("skips a character", () =>
    Effect.gen(function* () {
      assert.strictEqual(yield* planTypo("hello").pipe(Random.withSeed("seed-4")), "hell");
    })
  );

  it.effect("inserts a random lowercase letter", () =>
    Effect.gen(function* () {
      assert.strictEqual(yield* planTypo("hello").pipe(Random.withSeed("seed-18")), "hoello");
    })
  );

  it.effect("swaps adjacent characters", () =>
    Effect.gen(function* () {
      assert.strictEqual(yield* planTypo("hello").pipe(Random.withSeed("seed-95")), "hlelo");
    })
  );

  it.effect("only emits input characters or lowercase letters", () =>
    Effect.gen(function* () {
      // Seeds covering identity, skips, inserts, and swaps
      for (const seed of ["seed-1", "seed-4", "seed-15", "seed-18", "seed-21", "seed-29", "seed-32", "seed-95"]) {
        const typo = yield* planTypo("hello").pipe(Random.withSeed(seed));
        for (const char of typo) {
          assert.isTrue("hello".includes(char) || /[a-z]/.test(char), `unexpected character: ${char}`);
        }
      }
    })
  );
});

describe("planScript", () => {
  it.effect("types clean words directly with a trailing pause", () =>
    Effect.gen(function* () {
      const ops = yield* planScript("hi", (word) => Effect.succeed(word));

      assert.strictEqual(ops.length, 2);
      assert.deepStrictEqual(ops[0], TypeChars({ text: "hi " }));
      assert.strictEqual(ops[1]._tag, "Pause");
      if (ops[1]._tag === "Pause") {
        assert.isAtLeast(ops[1].millis, 60);
        assert.isAtMost(ops[1].millis, 100);
      }
    })
  );

  it.effect("types the typo, deletes it, then types the correct word", () =>
    Effect.gen(function* () {
      const ops = yield* planScript("hi", (word) => Effect.succeed(`${word}x`));

      assert.strictEqual(ops.length, 5);
      assert.deepStrictEqual(ops[0], TypeChars({ text: "hix " }));
      assert.strictEqual(ops[1]._tag, "Pause");
      assert.deepStrictEqual(ops[2], DeleteChars({ count: 4 }));
      assert.deepStrictEqual(ops[3], TypeChars({ text: "hi " }));
      assert.strictEqual(ops[4]._tag, "Pause");
    })
  );
});

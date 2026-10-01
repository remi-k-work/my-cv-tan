// services, features, and other libraries
import { assert, describe, it } from "@effect/vitest";
import { Array, Effect } from "effect";

// domain
import { planScript, planTypo } from "../actions";
import { applyOp } from "../helpers";
import { DeleteChars, Pause, TypeChars } from "../models";

describe("planTypo", () => {
  it.effect("only produces valid single-typo variants of the input", () =>
    Effect.gen(function* () {
      const word = "hello";

      // The complete space of valid outcomes: identity, every adjacent swap,
      // every single-character skip, and every single-letter insertion
      const swaps = Array.makeBy(word.length - 1, (i) => word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
      const skips = Array.makeBy(word.length, (i) => word.slice(0, i) + word.slice(i + 1));
      const letters = Array.makeBy(26, (i) => String.fromCharCode(97 + i));
      const inserts = letters.flatMap((letter) => Array.makeBy(word.length + 1, (i) => word.slice(0, i) + letter + word.slice(i)));
      const valid = new Set([word, ...swaps, ...skips, ...inserts]);

      const results = yield* Effect.all(Array.makeBy(200, () => planTypo(word)));

      assert.isAbove(results.length, 0);
      for (const typo of results) {
        assert.isTrue(valid.has(typo), `unexpected typo variant: ${typo}`);
      }
    })
  );

  it.effect("keeps the result within one edit of the input length", () =>
    Effect.gen(function* () {
      const typo = yield* planTypo("hello");
      assert.isAtLeast(typo.length, 4);
      assert.isAtMost(typo.length, 6);
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

describe("applyOp", () => {
  it("appends typed characters", () => {
    assert.strictEqual(applyOp("hi", TypeChars({ text: " there" })), "hi there");
  });

  it("deletes characters from the end", () => {
    assert.strictEqual(applyOp("hello", DeleteChars({ count: 2 })), "hel");
  });

  it("clamps over-deletion to the empty string", () => {
    assert.strictEqual(applyOp("hi", DeleteChars({ count: 5 })), "");
    assert.strictEqual(applyOp("hi", DeleteChars({ count: 0 })), "hi");
  });

  it("leaves the text untouched on pause", () => {
    assert.strictEqual(applyOp("hi", Pause({ millis: 100 })), "hi");
  });
});

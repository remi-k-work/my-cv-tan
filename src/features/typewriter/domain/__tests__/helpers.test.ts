// The pure text-shaping helpers the typewriter animation and the experience detail page's
// paragraph split both read.

import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { charCount, chunkTextByWords, randomLetter } from "../helpers";
import { LOWERCASE_LETTERS, MAX_CHUNK_LENGTH } from "../constants";

describe("chunkTextByWords", () => {
  it("keeps every word, in order, and joins them with single spaces", () => {
    assert.deepStrictEqual(chunkTextByWords("one two three", 80), ["one two three"]);
  });

  it("packs as many words per chunk as the limit allows rather than splitting mid-word", () => {
    // "aa bb" is 5 characters, so a limit of 5 fits both words in one chunk
    assert.deepStrictEqual(chunkTextByWords("aa bb cc", 5), ["aa bb", "cc"]);
  });

  it("never lets a chunk exceed the limit, unless a single word already does", () => {
    const chunks = chunkTextByWords("aa bb cc dd ee ff gg hh", 5);

    for (const chunk of chunks) {
      assert.isAtMost(chunk.length, 5, `"${chunk}" exceeds the limit`);
    }
    // A word longer than the limit becomes its own chunk: dropping or truncating it would lose
    // content the animation has to reproduce character for character
    assert.deepStrictEqual(chunkTextByWords("aaa bbbbbbbbb ccc", 5), ["aaa", "bbbbbbbbb", "ccc"]);
  });

  it("discards whitespace runs so no chunk starts or ends with one", () => {
    // Leading, trailing and inter-word runs collapse to a single separating space
    assert.deepStrictEqual(chunkTextByWords("  one   two  ", 80), ["one two"]);
  });

  it("returns no chunk for text with no words in it", () => {
    for (const text of ["", " ", "\t", "\n  \n"]) {
      assert.deepStrictEqual(chunkTextByWords(text, 80), []);
    }
  });

  it("reproduces the original words exactly when reassembled", () => {
    const text = "the quick brown fox jumps over the lazy dog and keeps running";
    const words = text.split(" ");

    assert.deepStrictEqual(chunkTextByWords(text, 12).flatMap((chunk) => chunk.split(" ")), words);
  });

  it("honours the page's own chunk length as a workable limit", () => {
    // The detail page renders one paragraph per chunk, so its constant has to actually trade
    // paragraph count against paragraph length rather than leaving everything in one chunk
    const chunks = chunkTextByWords("word ".repeat(40).trim(), MAX_CHUNK_LENGTH);

    assert.isAbove(chunks.length, 1);
    for (const chunk of chunks) {
      assert.isAtMost(chunk.length, MAX_CHUNK_LENGTH);
    }
  });
});

describe("charCount", () => {
  it("counts code points, so an astral character is one character rather than two", () => {
    // A surrogate pair is one user-visible character, and the typo planner emits one frame per
    // code point: counting UTF-16 units would misalign every later frame
    assert.strictEqual(charCount(""), 0);
    assert.strictEqual(charCount("a"), 1);
    assert.strictEqual(charCount("aeiou"), 5);
    // All Latin-1 supplement characters, so this string is one code point per character as well
    assert.strictEqual(charCount("Zażółć gęślą jaźń"), 17);
    assert.strictEqual(charCount("😀😀😀"), 3);
  });
});

describe("randomLetter", () => {
  it.effect("always draws from the insertion alphabet", () =>
    // Not seeded for a specific value: the invariant is the alphabet, not the pick
    Effect.gen(function* () {
      for (let draw = 0; draw < 20; draw++) {
        const letter = yield* randomLetter;
        assert.isTrue(LOWERCASE_LETTERS.includes(letter), `"${letter}" is not a lowercase letter`);
      }
    })
  );
});

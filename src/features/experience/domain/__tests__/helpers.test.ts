// services, features, and other libraries
import { assert, describe, it } from "@effect/vitest";

// domain
import { excerpt } from "../helpers";

// constants
import { EXCERPT_SUFFIX } from "../constants";

describe("excerpt", () => {
  it("returns text that already fits untouched", () => {
    assert.strictEqual(excerpt("Short text.", 160), "Short text.");
  });

  it("cuts at the last word boundary inside the limit and counts the suffix in the budget", () => {
    // The suffix is part of the budget, so the whole result — ellipsis included — stays within it
    assert.strictEqual(excerpt("one two three four", 12), `one two${EXCERPT_SUFFIX}`);
    assert.strictEqual(excerpt("one two three four", 12).length <= 12, true);
    // The suffix can no longer push a truncated summary past the limit a search engine enforces
    assert.strictEqual(excerpt("word ", 7).length <= 7, true);
  });

  it("counts astral characters as one and never splits a surrogate pair", () => {
    // Each emoji is one code point but two UTF-16 code units; slicing by code point keeps every
    // emoji whole instead of cutting one in half into an invalid lone surrogate. The suffix counts
    // as one character in the budget, so four emoji plus it fill a five-character limit exactly.
    const result = excerpt("😀😀😀😀😀😀", 5);

    assert.strictEqual(result, `😀😀😀😀${EXCERPT_SUFFIX}`);
    assert.strictEqual(Array.from(result).length, 5);
    assert.isFalse(result.includes("\uFFFD"));
  });
});

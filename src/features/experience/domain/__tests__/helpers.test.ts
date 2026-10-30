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

  it("cuts at the last word boundary inside the limit", () => {
    assert.strictEqual(excerpt("one two three", 9), `one two${EXCERPT_SUFFIX}`);
  });

  it("counts astral characters as one and never splits a surrogate pair", () => {
    // Each emoji is two UTF-16 code units but one code point, so a two-character budget keeps
    // both emoji whole instead of slicing one in half into an invalid lone surrogate
    const result = excerpt("😀😀😀", 2);

    assert.strictEqual(result, `😀😀${EXCERPT_SUFFIX}`);
    assert.isFalse(result.includes("\uFFFD"));
  });
});
// services, features, and other libraries
import { assert, describe, it } from "@effect/vitest";

// domain
import { excerpt, experienceImagePath, haveSameExperienceSlugs, isEmployment } from "../helpers";

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
    // The suffix counts as one grapheme, so four emoji plus it fill a five-character limit exactly.
    const result = excerpt("😀😀😀😀😀😀", 5);

    assert.strictEqual(result, `😀😀😀😀${EXCERPT_SUFFIX}`);
    assert.strictEqual(Array.from(result).length, 5);
    assert.isFalse(result.includes("\uFFFD"));
  });

  it("keeps combining marks and joined emoji intact and handles an empty limit", () => {
    assert.strictEqual(excerpt("e\u0301e\u0301e\u0301", 2), `e\u0301${EXCERPT_SUFFIX}`);
    assert.strictEqual(excerpt("👩‍💻👩‍💻👩‍💻", 2), `👩‍💻${EXCERPT_SUFFIX}`);
    assert.strictEqual(excerpt("Some text", 0), "");
  });
});

describe("haveSameExperienceSlugs", () => {
  it("accepts the same unique route identities regardless of localized display order", () => {
    assert.isTrue(haveSameExperienceSlugs([{ slug: "role-a" }, { slug: "project-b" }], [{ slug: "project-b" }, { slug: "role-a" }]));
  });

  it("rejects missing, extra, or duplicated route identities", () => {
    const english = [{ slug: "role-a" }, { slug: "project-b" }];

    assert.isFalse(haveSameExperienceSlugs(english, [{ slug: "role-a" }]));
    assert.isFalse(haveSameExperienceSlugs(english, [...english, { slug: "project-c" }]));
    assert.isFalse(haveSameExperienceSlugs(english, [{ slug: "role-a" }, { slug: "role-a" }]));
    assert.isFalse(haveSameExperienceSlugs([{ slug: "role-a" }, { slug: "role-a" }], english));
  });
});

describe("isEmployment", () => {
  it("names the kind the two experience types stand for", () => {
    // The head's article section, the JSON-LD subject node and the twin's fact type all label one of
    // the two kinds, so the label they read has to answer for both and for nothing else.
    assert.isTrue(isEmployment({ type: "e" }));
    assert.isFalse(isEmployment({ type: "p" }));
  });
});

describe("experienceImagePath", () => {
  it("encodes the image name as one path segment and appends the requested frame", () => {
    assert.strictEqual(experienceImagePath("01", "a"), "/images/01-a.webp");
    assert.strictEqual(experienceImagePath("shot/name?dark#crop", "b"), "/images/shot%2Fname%3Fdark%23crop-b.webp");
  });
});

// The pure, cross-feature helpers in src/domain/helpers.ts: language normalization and language
// selection, which every surface resolves the site language through

import { assert, describe, it } from "@effect/vitest";
import { matchPreferredLanguage, preferredLanguageFromLocale, translateSource } from "../helpers";

describe("preferredLanguageFromLocale", () => {
  it("keeps Polish only for the exact configured locale and resolves everything else to English", () => {
    assert.strictEqual(preferredLanguageFromLocale("pl"), "pl");
    // Region-suffixed, upper-cased and unknown spellings are not the configured locale
    assert.strictEqual(preferredLanguageFromLocale("pl-PL"), "en");
    assert.strictEqual(preferredLanguageFromLocale("PL"), "en");
    assert.strictEqual(preferredLanguageFromLocale("en"), "en");
    assert.strictEqual(preferredLanguageFromLocale("en-US"), "en");
    assert.strictEqual(preferredLanguageFromLocale(""), "en");
    assert.strictEqual(preferredLanguageFromLocale("de"), "en");
    assert.strictEqual(preferredLanguageFromLocale("polski"), "en");
  });

  it("stays total for any locale string a caller can hand it", () => {
    for (const locale of ["pl", "en", "pl-PL", "en-GB", "", "xx", "0", "pl-pl", "pl "]) {
      assert.include(["en", "pl"], preferredLanguageFromLocale(locale));
    }
  });
});

describe("matchPreferredLanguage", () => {
  it("selects the branch that names the language it was resolved for, not a default", () => {
    // The two branches are deliberately distinguishable values, so a helper that always answered
    // with one of them could not pass
    assert.strictEqual(matchPreferredLanguage("en", "English", "Polish"), "English");
    assert.strictEqual(matchPreferredLanguage("pl", "English", "Polish"), "Polish");
  });

  it("carries any value type through uncoerced", () => {
    assert.deepStrictEqual(matchPreferredLanguage("pl", [1, 2], [3, 4]), [3, 4]);
    // The selected branch is returned exactly as authored, so a caller may hand either branch the
    // full value type it wants — including `null` — without a truthiness check swallowing it
    const english: number | null = matchPreferredLanguage("en", 1, null);
    const polish: number | null = matchPreferredLanguage("pl", 1, null);
    assert.strictEqual(english, 1);
    assert.isNull(polish);
  });
});

it("translateSource is the identity function the source-language surfaces render with", () => {
  assert.strictEqual(translateSource("Experience"), "Experience");
  assert.strictEqual(translateSource(""), "");
  // The English-only documents must publish the source string unchanged, so a translated-looking
  // value here would mean a dictionary leaked into a surface that declares English
  assert.strictEqual(translateSource("Rzeszów, Poland"), "Rzeszów, Poland");
  assert.strictEqual(translateSource("Already translated"), translateSource("Already translated"));
});

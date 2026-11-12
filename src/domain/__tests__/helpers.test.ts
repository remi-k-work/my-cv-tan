// The pure, cross-feature helpers in src/domain/helpers.ts: language normalization and language
// selection (every surface resolves the site language through them), and the loader-driven page
// copy lookup that every static page head and Markdown twin falls back through.

import { assert, describe, it } from "@effect/vitest";
import { matchPreferredLanguage, pageField, preferredLanguageFromLocale, translateSource } from "../helpers";

// types
import type { PagePath, PageTitles } from "@/domain/models";

// constants
import { EDUCATION_PATH } from "@/domain/constants";

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

describe("pageField", () => {
  it("reads the requested field of the requested page when loader data is complete", () => {
    const pageTitles: PageTitles = {
      "/": { eyebrow: "Home eyebrow", heading: "Home heading", intro: "Home intro" },
      "/education": { eyebrow: "Education eyebrow", heading: "Education heading", intro: "Education intro" },
      "/contact": { eyebrow: "Contact eyebrow", heading: "Contact heading", intro: "Contact intro" },
    };

    assert.strictEqual(pageField(pageTitles, EDUCATION_PATH, "heading", "fallback"), "Education heading");
    assert.strictEqual(pageField(pageTitles, EDUCATION_PATH, "intro", "fallback"), "Education intro");
  });

  it("falls back when the loader delivered no titles at all", () => {
    assert.strictEqual(pageField(null, EDUCATION_PATH, "heading", "fallback"), "fallback");
  });

  it("falls back when the loader delivered titles that omit the requested page", () => {
    // A partial payload is the same missing data as no payload: the page's own authored catalogue
    // copy is what the caller passes as the fallback
    const partial: Partial<PageTitles> = {
      "/": { eyebrow: "Home eyebrow", heading: "Home heading", intro: "Home intro" },
    };

    for (const pagePath of ["/", "/education", "/contact"] as ReadonlyArray<PagePath>) {
      const present = partial[pagePath] !== undefined;
      assert.strictEqual(pageField(partial, pagePath, "heading", "fallback"), present ? partial[pagePath]?.heading : "fallback");
    }
  });

  it("keeps the two keys independent so one cannot substitute for the other", () => {
    const pageTitles = {
      "/": { eyebrow: "Eyebrow", heading: "Heading", intro: "Intro" },
      "/education": { eyebrow: "Eyebrow", heading: "Heading", intro: "Intro" },
      "/contact": { eyebrow: "Eyebrow", heading: "Heading", intro: "Intro" },
    } as PageTitles;

    assert.strictEqual(pageField(pageTitles, "/", "heading", "heading fallback"), "Heading");
    assert.strictEqual(pageField(pageTitles, "/", "intro", "intro fallback"), "Intro");
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

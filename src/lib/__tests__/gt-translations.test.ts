// The translation boundary every Polish machine-readable document reads its copy through: the
// committed locale dictionaries GT's cache loads each locale with, and the sync translate function
// a pinned ?lang= document resolves its registered msg() sources with.

import { assert, describe, it } from "@effect/vitest";
import { Option, Record, Schema } from "effect";
import { initializeGT } from "gt-tanstack-start";
import gtConfig from "../../../gt.config.json";
import { loadTranslations, translateForLanguage } from "@/lib/gt-translations";
import { preferredLanguageFromLocale } from "@/domain/helpers";
import { DEFAULT_LANGUAGE } from "@/domain/constants";

// Initializes the GT runtime the way the router does, so the translate function reads the same
// cached dictionary a route does.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

// The same shape the loader asserts, read through the module's own decoder: a dictionary is a
// record of hash-keyed strings, and the decoder rejects anything else
const TranslationDictionary = Schema.Record(Schema.String, Schema.String);
const isTranslationDictionary = Schema.is(TranslationDictionary);

describe("loadTranslations", () => {
  it("resolves the requested language's committed dictionary", async () => {
    assert.isTrue(isTranslationDictionary(await loadTranslations("en")));
    assert.isTrue(isTranslationDictionary(await loadTranslations("pl")));
  });

  it("normalizes a locale the site does not declare onto the default language", async () => {
    // A region suffix, casing or an unknown spelling is not a configured locale, so the map of
    // allowed dictionaries hands the caller the same default bundle the schema resolves to
    assert.deepStrictEqual(await loadTranslations("pl-PL"), await loadTranslations(DEFAULT_LANGUAGE));
    assert.deepStrictEqual(await loadTranslations("de"), await loadTranslations(DEFAULT_LANGUAGE));
  });

  it("keeps every entry a string, so a dictionary lookup never reads a non-string value", async () => {
    for (const locale of ["en", "pl"]) {
      const dictionary = await loadTranslations(locale);
      assert.isTrue(Record.every(dictionary, (_key, value) => typeof value === "string"));
    }
  });
});

describe("committed dictionaries", () => {
  // A term both languages spell the same is not a missing translation
  const IDENTICAL_BY_DESIGN = new Set(["Captcha", "Email"]);

  it("carries the same keys in every locale", async () => {
    const en = await loadTranslations("en");
    const pl = await loadTranslations("pl");

    assert.deepStrictEqual(Object.keys(pl).sort(), Object.keys(en).sort());
  });

  it("keeps no Polish entry a silent copy of its English source", async () => {
    const en = await loadTranslations("en");
    const pl = await loadTranslations("pl");
    // A gt generate run fills any source it could not translate with the English string, so a
    // value that still equals its source is the machine-readable signal of missing Polish copy
    const untranslated = Object.keys(en).filter((key) => pl[key] === en[key] && !IDENTICAL_BY_DESIGN.has(en[key] ?? ""));

    assert.deepStrictEqual(
      untranslated.map((key) => `${key} = ${en[key]}`),
      []
    );
  });
});

describe("translateForLanguage", () => {
  it("resolves the requested language's copy from its hashed dictionary", async () => {
    const translate = await translateForLanguage("pl");

    // The source strings the Markdown twins publish as section headings and link labels; each
    // resolves only if the hash is computed the way the runtime dictionary keys it
    assert.strictEqual(translate("Experience"), "Doświadczenie");
    assert.strictEqual(translate("Portfolio Projects"), "Projekty do Portfolio");
    assert.strictEqual(translate("Channels"), "Kanały");
  });

  it("returns a source string the dictionary has no entry for unchanged", async () => {
    const translate = await translateForLanguage("pl");

    // A string no msg() registered is not a key the dictionary can carry, so the document keeps
    // its source copy rather than publishing an empty or fabricated heading
    assert.strictEqual(translate("Not a registered source string"), "Not a registered source string");
  });

  it("is the identity for the source language, which never consults a dictionary", async () => {
    const translate = await translateForLanguage("en");

    assert.strictEqual(translate("Experience"), "Experience");
    assert.strictEqual(translate("Anything at all"), "Anything at all");
  });
});

it("the locale vocabulary every dictionary is selected through is limited to the site's languages", () => {
  // `preferredLanguageFromLocale` is the single decoder the loaders are keyed on, so an unlisted
  // spelling must land on the default rather than widen the dictionary map
  assert.deepStrictEqual(Option.some(preferredLanguageFromLocale("pl")), Option.some("pl"));
  for (const locale of ["en", "pl-PL", "de", "", "polski"]) {
    assert.include(["en", "pl"], preferredLanguageFromLocale(locale));
  }
});
// Direct unit tests for the Open Graph / Twitter Card builders in ./social.
// All tags are pure functions of a SocialMetaInput. Tags are located by key
// and deep-compared, since assert.include uses reference equality for objects.

import { assert, it } from "@effect/vitest";
import { globalSocialImage, OPEN_GRAPH_LOCALES, socialMeta } from "../social";
import { AUTHOR_URL, PUBLISHER_URL, SITE_NAME } from "@/domain/site";
import { SocialImage, SocialMetaInput } from "../models";
import { LANGUAGE, metaTagsOf, tagContent } from "./fixtures";
import type { PreferredLanguage } from "@/domain/models";
import { SITE_LANGUAGE_NAMES } from "@/domain/constants";

const language: PreferredLanguage = LANGUAGE;

const image: SocialImage = {
  src: "https://www.remiforge.dev/images/01-a.webp",
  mime: "image/webp",
  width: 1600,
  height: 900,
  alt: "Screenshot of Full-Stack Developer",
};

const input: SocialMetaInput = {
  title: "Headline",
  description: "Description.",
  canonical: "https://www.remiforge.dev/test",
  image,
  preferredLanguage: language,
};

const tagsOf = (input: SocialMetaInput) => metaTagsOf(socialMeta(input));

it("socialMeta publishes the Open Graph core tags for a website", () => {
  const tags = tagsOf(input);

  assert.strictEqual(tagContent(tags, "property", "og:title"), "Headline");
  assert.strictEqual(tagContent(tags, "property", "og:description"), "Description.");
  assert.strictEqual(tagContent(tags, "property", "og:type"), "website");
  assert.strictEqual(tagContent(tags, "property", "og:url"), "https://www.remiforge.dev/test");
  assert.strictEqual(tagContent(tags, "property", "og:site_name"), SITE_NAME);
  assert.strictEqual(tagContent(tags, "property", "og:locale"), "en_US");
});

it("socialMeta publishes one HTTPS image with its structured properties", () => {
  const tags = tagsOf(input);

  assert.deepStrictEqual(tags.filter((tag) => tag.property === "og:image"), [{ property: "og:image", content: "https://www.remiforge.dev/images/01-a.webp" }]);
  assert.strictEqual(tagContent(tags, "property", "og:image:alt"), "Screenshot of Full-Stack Developer");
  assert.strictEqual(tagContent(tags, "property", "og:image:type"), "image/webp");
  assert.strictEqual(tagContent(tags, "property", "og:image:width"), "1600");
  assert.strictEqual(tagContent(tags, "property", "og:image:height"), "900");
  // og:image:url is equivalent to og:image, and secure_url is redundant for an HTTPS source
  assert.isUndefined(tagContent(tags, "property", "og:image:url"));
  assert.isUndefined(tagContent(tags, "property", "og:image:secure_url"));
});

it("socialMeta lists every other supported locale as og:locale:alternate, never its own", () => {
  const enTags = tagsOf(input);
  const plTags = tagsOf({ ...input, preferredLanguage: "pl" });

  assert.deepStrictEqual(
    enTags.filter((tag) => tag.property === "og:locale:alternate").map((tag) => tag.content),
    ["pl_PL"]
  );
  assert.deepStrictEqual(
    plTags.filter((tag) => tag.property === "og:locale:alternate").map((tag) => tag.content),
    ["en_US"]
  );
  // The page's own locale is only under og:locale
  assert.deepStrictEqual(
    enTags.filter((tag) => tag.property === "og:locale").map((tag) => tag.content),
    ["en_US"]
  );
});

it("socialMeta adds article attribution when ogType is article", () => {
  const tags = tagsOf({ ...input, ogType: "article", articleSection: "employment" });

  assert.strictEqual(tagContent(tags, "property", "og:type"), "article");
  assert.strictEqual(tagContent(tags, "property", "article:author"), AUTHOR_URL);
  assert.strictEqual(tagContent(tags, "property", "article:publisher"), PUBLISHER_URL);
  assert.strictEqual(tagContent(tags, "property", "article:section"), "employment");
});

it("socialMeta omits article attribution for website type", () => {
  const tags = tagsOf(input);

  assert.notInclude(JSON.stringify(tags), "article:author");
  assert.notInclude(JSON.stringify(tags), "article:publisher");
  assert.notInclude(JSON.stringify(tags), "article:section");
});

it("socialMeta publishes Twitter Card tags with the same page-specific image as Open Graph", () => {
  const tags = tagsOf(input);

  assert.strictEqual(tagContent(tags, "name", "twitter:card"), "summary_large_image");
  assert.strictEqual(tagContent(tags, "name", "twitter:title"), "Headline");
  assert.strictEqual(tagContent(tags, "name", "twitter:description"), "Description.");
  // X supports WebP, so a detail card can use its relevant screenshot instead of a generic banner
  assert.strictEqual(tagContent(tags, "name", "twitter:image"), image.src);
  assert.strictEqual(tagContent(tags, "name", "twitter:image:alt"), image.alt);
  assert.strictEqual(globalSocialImage("pl").alt, "Kolaż portfolio przedstawiający umiejętności tworzenia stron i zrzuty projektów");
});

it("the Open Graph locale vocabulary names one locale per supported language", () => {
  // og:locale and og:locale:alternate are validated against a closed vocabulary, so a language
  // declared without a locale would publish an invalid tag on every page in that language.
  for (const language of ["en", "pl"] as const) {
    assert.strictEqual(OPEN_GRAPH_LOCALES[language].length > 0, true);
    assert.strictEqual(SITE_LANGUAGE_NAMES[language].length > 0, true);
  }
  // The two vocabularies must stay in step: a language the site publishes but the OG vocabulary
  // omits would leave that page's card with no locale, and a stray OG-only key would never render.
  assert.deepStrictEqual(Object.keys(OPEN_GRAPH_LOCALES), Object.keys(SITE_LANGUAGE_NAMES));
});

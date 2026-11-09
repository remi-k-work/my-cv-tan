// Direct unit tests for the Open Graph / Twitter Card builders in ./social-meta.
// All tags are pure functions of a SocialMetaInput. Tags are located by key
// and deep-compared, since assert.include uses reference equality for objects.

import { assert, it } from "@effect/vitest";
import { globalSocialImage, socialMeta } from "../social-meta";
import { AUTHOR_URL, GLOBAL_SOCIAL_IMAGE, PUBLISHER_URL, SITE_NAME } from "../constants";
import { SocialImage, SocialMetaInput } from "../models";
import type { PreferredLanguage } from "@/domain/models";

const language: PreferredLanguage = "en";

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

const tagsOf = (input: SocialMetaInput) => JSON.parse(JSON.stringify(socialMeta(input))) as ReadonlyArray<Record<string, string>>;

// Finds a tag by its property or name and returns its content, or undefined when absent.
const tagContent = (tags: ReadonlyArray<Record<string, string>>, key: "property" | "name", value: string) => tags.find((tag) => tag[key] === value)?.content;

it("socialMeta publishes the Open Graph core tags for a website", () => {
  const tags = tagsOf(input);

  assert.strictEqual(tagContent(tags, "property", "og:title"), "Headline");
  assert.strictEqual(tagContent(tags, "property", "og:description"), "Description.");
  assert.strictEqual(tagContent(tags, "property", "og:type"), "website");
  assert.strictEqual(tagContent(tags, "property", "og:url"), "https://www.remiforge.dev/test");
  assert.strictEqual(tagContent(tags, "property", "og:site_name"), SITE_NAME);
  assert.strictEqual(tagContent(tags, "property", "og:locale"), "en_US");
});

it("socialMeta publishes the og:image family with both spellings of the src", () => {
  const tags = tagsOf(input);

  const imageTags = tags.filter((tag) => tag.property === "og:image" || tag.property === "og:image:url");
  assert.deepStrictEqual(imageTags, [
    { property: "og:image", content: "https://www.remiforge.dev/images/01-a.webp" },
    { property: "og:image:url", content: "https://www.remiforge.dev/images/01-a.webp" },
  ]);
  assert.strictEqual(tagContent(tags, "property", "og:image:alt"), "Screenshot of Full-Stack Developer");
  assert.strictEqual(tagContent(tags, "property", "og:image:type"), "image/webp");
  assert.strictEqual(tagContent(tags, "property", "og:image:width"), "1600");
  assert.strictEqual(tagContent(tags, "property", "og:image:height"), "900");
  assert.strictEqual(tagContent(tags, "property", "og:image:secure_url"), "https://www.remiforge.dev/images/01-a.webp");
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

it("socialMeta publishes Twitter Card tags with the JPEG banner for X", () => {
  const tags = tagsOf(input);

  assert.strictEqual(tagContent(tags, "name", "twitter:card"), "summary_large_image");
  assert.strictEqual(tagContent(tags, "name", "twitter:title"), "Headline");
  assert.strictEqual(tagContent(tags, "name", "twitter:description"), "Description.");
  // X rejects WebP, so the Twitter image is always the global JPEG banner
  assert.strictEqual(tagContent(tags, "name", "twitter:image"), GLOBAL_SOCIAL_IMAGE.src);
  assert.strictEqual(tagContent(tags, "name", "twitter:image:alt"), "Portfolio collage showing web development skills and project screenshots");
  assert.strictEqual(globalSocialImage("pl").alt, "Kolaż portfolio przedstawiający umiejętności tworzenia stron i zrzuty projektów");
});

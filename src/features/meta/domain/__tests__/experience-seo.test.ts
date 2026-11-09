// Direct unit tests for the experience SEO identity builder.
// The HTML head, JSON-LD graph and Markdown twin all derive from this one record,
// so its fields must be correct and consistent on their own.

import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";
import { experienceScreenshot, experienceSeo } from "../helpers";
import { META_DESCRIPTION_LENGTH } from "../constants";
import type { Experience } from "@/features/experience/domain/models";

const sampleExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

it("derives canonical, path, markdownPath, headline and description from one experience", () => {
  const seo = experienceSeo({ experience: sampleExperience, preferredLanguage: "en" });

  assert.strictEqual(seo.path, "/sample-role");
  assert.strictEqual(seo.canonical, "https://www.remiforge.dev/sample-role");
  assert.strictEqual(seo.markdownPath, "/sample-role.md");
  assert.strictEqual(seo.headline, "Full-Stack Developer");
  assert.strictEqual(seo.description, "Built things with care.");
  assert.strictEqual(seo.preferredLanguage, "en");
  assert.deepStrictEqual(seo.experience, sampleExperience);
});

it("localizes headline and description for Polish", () => {
  const en = experienceSeo({ experience: sampleExperience, preferredLanguage: "en" });
  const pl = experienceSeo({ experience: sampleExperience, preferredLanguage: "pl" });

  // Same canonical/path regardless of language
  assert.strictEqual(en.canonical, pl.canonical);
  assert.strictEqual(en.path, pl.path);
  assert.strictEqual(en.markdownPath, pl.markdownPath);
  // Localized headline differs
  assert.notStrictEqual(en.headline, pl.headline);
  // Description is excerpted to the meta length cap
  assert.strictEqual(pl.description.length <= META_DESCRIPTION_LENGTH, true);
});

it("resolves screenshot facts when an image is published", () => {
  const withShot = experienceSeo({ experience: sampleExperience, preferredLanguage: "en" });
  assert.deepStrictEqual(Option.getOrThrow(withShot.screenshot), {
    src: "https://www.remiforge.dev/images/01-a.webp",
    mime: "image/webp",
    width: 1600,
    height: 900,
  });

  const withoutShot = experienceSeo({
    experience: { ...sampleExperience, imageName: "" },
    preferredLanguage: "en",
  });
  assert.deepStrictEqual(withoutShot.screenshot, Option.none());
});

it("experienceScreenshot resolves verified WebP facts and ignores an unpublished image", () => {
  const published = {
    src: "https://www.remiforge.dev/images/01-a.webp",
    mime: "image/webp",
    width: SCREENSHOT_WIDTH,
    height: SCREENSHOT_HEIGHT,
  } as const;

  assert.deepStrictEqual(experienceScreenshot("01"), Option.some(published));
  // The name is trimmed, so stray formatting whitespace still resolves the file the UI renders
  assert.deepStrictEqual(experienceScreenshot(" 01 "), Option.some(published));
  // An empty or whitespace-only name means the page publishes no screenshot
  assert.deepStrictEqual(experienceScreenshot(""), Option.none());
  assert.deepStrictEqual(experienceScreenshot("   "), Option.none());
  // The name is one path segment, so a hostile value cannot escape /images/
  assert.strictEqual(Option.getOrThrow(experienceScreenshot("../secret")).src, "https://www.remiforge.dev/images/..%2Fsecret-a.webp");
});

it("encodes slugs consistently in path, canonical and markdownPath", () => {
  const seo = experienceSeo({ experience: { ...sampleExperience, slug: "role (senior) & more" }, preferredLanguage: "en" });
  const encoded = "/role%20%28senior%29%20%26%20more";

  assert.strictEqual(seo.path, encoded);
  assert.strictEqual(seo.canonical, `https://www.remiforge.dev${encoded}`);
  assert.strictEqual(seo.markdownPath, `${encoded}.md`);
});

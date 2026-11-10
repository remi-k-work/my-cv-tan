import { assert, it } from "@effect/vitest";
import { PAGE_ENTRIES, experienceEntry, pageEntry } from "../catalogue";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";
import { absoluteUrl, markdownTwinUrl } from "@/features/meta/domain/urls";
import { experienceSeo } from "@/features/meta/domain/seo";
import { sampleExperience } from "@/features/markdown/__tests__/fixtures";

it("the catalogue declares every static page exactly once", () => {
  assert.deepStrictEqual(
    PAGE_ENTRIES.map(({ name }) => name),
    STATIC_PAGE_PATHS.map((path) => STATIC_PAGES[path].label)
  );

  for (const path of STATIC_PAGE_PATHS) {
    const entry = pageEntry(path);

    assert.strictEqual(entry.name, STATIC_PAGES[path].label, `${path} name`);
    assert.strictEqual(entry.mdHref, STATIC_PAGES[path].mdHref, `${path} twin route`);
    assert.strictEqual(entry.canonical, absoluteUrl(path), `${path} canonical`);
    assert.strictEqual(entry.summary, STATIC_PAGES[path].indexSummary, `${path} summary`);
  }
});

it("page entries advertise the canonical HTML URL and compute their twin URL with an explicit language", () => {
  for (const entry of PAGE_ENTRIES) {
    assert.isFalse(entry.canonical.includes(".md"), `canonical advertised a twin: ${entry.canonical}`);
    assert.include(entry.mdHref, ".md");

    const twin = markdownTwinUrl(entry.mdHref, "en");
    assert.include(twin, ".md?lang=en");
    assert.isString(entry.summary);
  }
});

it("experience entries carry only index metadata; the renderer chooses the language", () => {
  const seo = experienceSeo({ experience: sampleExperience, preferredLanguage: "en" });
  const entry = experienceEntry(seo);

  assert.strictEqual(entry.name, seo.headline);
  assert.strictEqual(entry.canonical, seo.canonical);
  assert.strictEqual(entry.mdHref, seo.markdownPath);
  assert.isUndefined(entry.summary);
  assert.strictEqual(markdownTwinUrl(entry.mdHref, "pl"), `${seo.canonical}.md?lang=pl`);
});

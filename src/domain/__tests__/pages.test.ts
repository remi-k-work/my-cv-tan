// Direct unit tests for the static page catalogue and copy resolver.
// `staticPageCopy` is the single source of truth for localized static page SEO data,
// shared by HTML heads, Markdown twins, and the sitemap.

import { assert, it } from "@effect/vitest";
import { STATIC_PAGES, STATIC_PAGE_PATHS, staticPageCopy } from "@/domain/pages";
import { HOME_PATH, EDUCATION_PATH, CONTACT_PATH, META_DESCRIPTION_LENGTH, SITE_LANGUAGES } from "@/domain/constants";
import { BRANDED_TITLE } from "@/domain/site";

// types
import type { PageTitles } from "@/domain/models";

// Loader titles stand in for the real payload: the catalogue falls back to its own copy when a
// title is missing, so the resolver is exercised with one stable, authored value per page.
const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

it("resolves localized copy for every static page path", () => {
  for (const pagePath of STATIC_PAGE_PATHS) {
    for (const language of ["en", "pl"] as const) {
      const copy = staticPageCopy(stablePageTitles, pagePath, language);

      assert.strictEqual(copy.path, pagePath);
      assert.strictEqual(copy.mdHref, STATIC_PAGES[pagePath].mdHref);
      assert.strictEqual(copy.type, STATIC_PAGES[pagePath].type);
      assert.strictEqual(copy.preferredLanguage, language);
      assert.strictEqual(copy.canonical, `https://www.remiforge.dev${pagePath}`);
      assert.strictEqual(copy.seoTitle, STATIC_PAGES[pagePath].copy[language].title);
      // `intro` prefers loader data when present, otherwise falls back to catalogue
      const loaderIntro = stablePageTitles[pagePath]?.intro;
      assert.strictEqual(copy.intro, loaderIntro ?? STATIC_PAGES[pagePath].copy[language].intro);
      assert.strictEqual(copy.description, STATIC_PAGES[pagePath].copy[language].description);
    }
  }
});

it("uses authored page titles from loader data when available", () => {
  const copy = staticPageCopy(stablePageTitles, HOME_PATH, "en");
  assert.strictEqual(copy.pageName, "Stable home title");
  assert.strictEqual(copy.seoTitle, STATIC_PAGES[HOME_PATH].copy.en.title);
});

it("falls back to catalogue heading when loader data is missing", () => {
  const emptyTitles: Partial<typeof stablePageTitles> = {};
  const copy = staticPageCopy(emptyTitles, HOME_PATH, "en");
  assert.strictEqual(copy.pageName, STATIC_PAGES[HOME_PATH].copy.en.heading);
});

it("catalogue declares exactly the three static page paths", () => {
  assert.deepStrictEqual(STATIC_PAGE_PATHS, [HOME_PATH, EDUCATION_PATH, CONTACT_PATH]);
});

it("every static page description and branded title fits within SEO snippet limits across all languages", () => {
  for (const pagePath of STATIC_PAGE_PATHS) {
    for (const language of SITE_LANGUAGES) {
      const { title, description } = STATIC_PAGES[pagePath].copy[language];
      assert.isAtMost(description.length, META_DESCRIPTION_LENGTH, `${pagePath} (${language}) description exceeds ${META_DESCRIPTION_LENGTH}`);
      assert.isBelow(BRANDED_TITLE(title).length, META_DESCRIPTION_LENGTH, `${pagePath} (${language}) branded title is too long`);
    }
  }
});

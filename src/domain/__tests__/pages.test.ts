// Direct unit tests for the static page catalogue and copy resolver
// `staticPageCopy` is the single source of truth for localized static page SEO data,
// shared by HTML heads, Markdown twins, and the sitemap

import { assert, it } from "@effect/vitest";
import { STATIC_PAGES, STATIC_PAGE_PATHS, pageHeading, staticPageCopy } from "@/domain/pages";
import { HOME_PATH, EDUCATION_PATH, CONTACT_PATH, META_DESCRIPTION_LENGTH, SITE_LANGUAGES } from "@/domain/constants";
import { BRANDED_TITLE } from "@/domain/site";

it("resolves localized copy for every static page path", () => {
  for (const pagePath of STATIC_PAGE_PATHS) {
    for (const language of ["en", "pl"] as const) {
      const copy = staticPageCopy(pagePath, language);

      assert.strictEqual(copy.path, pagePath);
      assert.strictEqual(copy.mdHref, STATIC_PAGES[pagePath].mdHref);
      assert.strictEqual(copy.type, STATIC_PAGES[pagePath].type);
      assert.strictEqual(copy.preferredLanguage, language);
      assert.strictEqual(copy.canonical, `https://www.remiforge.dev${pagePath}`);
      assert.strictEqual(copy.heading, STATIC_PAGES[pagePath].copy[language].heading);
      assert.strictEqual(copy.title, STATIC_PAGES[pagePath].copy[language].title);
      assert.strictEqual(copy.intro, STATIC_PAGES[pagePath].copy[language].intro);
      assert.strictEqual(copy.description, STATIC_PAGES[pagePath].copy[language].description);
    }
  }
});

it("reads the catalogue heading for the visible page", () => {
  assert.strictEqual(pageHeading(HOME_PATH, "en"), STATIC_PAGES[HOME_PATH].copy.en.heading);
  assert.strictEqual(pageHeading(HOME_PATH, "pl"), STATIC_PAGES[HOME_PATH].copy.pl.heading);
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

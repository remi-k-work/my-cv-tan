import { assert, it } from "@effect/vitest";
import { AI_INDEX_MARKDOWN_LINKS, detailPagesSection, pagesSection } from "../twin-nav";
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { translateEn, translatePl } from "@/features/markdown/__tests__/fixtures";
import type { PagePath } from "@/domain/models";

it("pagesSection excludes the linking page itself", () => {
  const links = pagesSection("/", "en", translateEn);
  assert.notInclude(links, "index.md");
  assert.include(links, "education.md?lang=en");
  assert.include(links, "contact.md?lang=en");
});

it("the twin graph enumerates the static pages from the one declaration every surface reads", () => {
  // The sibling set is derived from STATIC_PAGES — the same table the HTML head, the sitemap and
  // the twin routes walk — rather than from a second path table that has to agree by hand. A page
  // declared there is picked up by the graph, and a page that never was cannot appear in it.
  const staticPaths = Object.keys(STATIC_PAGES) as ReadonlyArray<PagePath>;

  for (const path of staticPaths) {
    const links = pagesSection(path, "en", translateEn);
    // Every other static page plus the two AI indexes — nothing else, exactly once
    assert.strictEqual((links.match(/^- \[/gm) ?? []).length, staticPaths.length - 1 + AI_INDEX_MARKDOWN_LINKS.length);
    // The two indexes are exactly the advertised links, not a longer or shorter list
    for (const index of AI_INDEX_MARKDOWN_LINKS) assert.include(links, `- ${index}`);
    // No twin advertises itself, in any location
    assert.notInclude(links, `${STATIC_PAGES[path].mdHref}?lang=en`);
    // Every sibling is pinned to the reader's own language, not a negotiated variant
    for (const sibling of staticPaths.filter((other) => other !== path)) {
      assert.include(links, `${STATIC_PAGES[sibling].mdHref}?lang=en`);
    }
  }
});

it("every twin closes with the one shared Pages section, translated with the reader's language", () => {
  // The section is the twin's only outbound crawl-graph edge set, and it is the same section both
  // the static twins and the detail twin print: one heading key, one sibling rule, one link list.
  const home = pagesSection("/", "pl", translatePl);
  assert.include(home, "## Strony");
  assert.notInclude(home, `${STATIC_PAGES["/"].mdHref}?lang=pl`);

  const detail = detailPagesSection("pl", translatePl);
  assert.include(detail, "## Strony");
  assert.include(detail, "[Strona główna](https://www.remiforge.dev/index.md?lang=pl)");
  for (const index of AI_INDEX_MARKDOWN_LINKS) assert.include(detail, `- ${index}`);

  // A polish twin's own chapter never labels the section in English
  assert.notInclude(home, "## Pages");
  assert.notInclude(detail, "## Pages");
});

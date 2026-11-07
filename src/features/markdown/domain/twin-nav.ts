// The crawl graph every Markdown twin publishes: its "Pages" section, the sibling twins and AI
// indexes that section links, and the escape line a dead-end document walks a reader through.
// Document bodies live in ./twins and ./detail-twin; the declarations these links resolve against
// live in ../meta.

// domain
import { escapeMdInline } from "./escape";
import { mdBulletList, mdLink, mdTitledSection, translatedLink } from "./format";

// meta (shared)
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";
import { HOME_PATH } from "@/domain/constants";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import { AI_INDEXES, LLMS_TXT_INDEX } from "@/features/meta/domain/link-tags";

// types
import type { PagePath, PreferredLanguage, Translate } from "@/domain/models";

// The two AI indexes every twin links to, so each document walks a reader back to the retrieval surface.
export const AI_INDEX_MARKDOWN_LINKS: ReadonlyArray<string> = AI_INDEXES.map(({ name, url }) => mdLink(name, url));

const homeLink = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  translatedLink(STATIC_PAGES[HOME_PATH].label, markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, preferredLanguage), translate);

// Sibling twins for a static page, plus the two AI indexes; a page never links itself.
const twinIndexLinks = (pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([
    ...STATIC_PAGE_PATHS.filter((path) => path !== pagePath).map((path) =>
      translatedLink(STATIC_PAGES[path].label, markdownTwinUrl(STATIC_PAGES[path].mdHref, preferredLanguage), translate)
    ),
    ...AI_INDEX_MARKDOWN_LINKS,
  ]);

// A detail page has no siblings of its own kind, so it points at the home twin and the indexes.
const detailIndexLinks = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([homeLink(preferredLanguage, translate), ...AI_INDEX_MARKDOWN_LINKS]);

// The section every twin closes with. It lives beside the links it renders rather than in each twin
// body, so its title, its links and the rule that a twin never advertises itself are decided once.
export const pagesSection = (pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdTitledSection(translate("Pages"), twinIndexLinks(pagePath, preferredLanguage, translate));

export const detailPagesSection = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdTitledSection(translate("Pages"), detailIndexLinks(preferredLanguage, translate));

// A 404 has no document to walk back to, so its escape line spells the two links out in prose.
export const deadEndEscapeLine = (preferredLanguage: PreferredLanguage, translate: Translate) => {
  const indexLink = mdLink(LLMS_TXT_INDEX.name, LLMS_TXT_INDEX.url);
  return `${escapeMdInline(translate("See"))} ${homeLink(preferredLanguage, translate)} ${escapeMdInline(translate("or"))} ${indexLink}.`;
};

// services, features, and other libraries
import { Array } from "effect";
import { mdBulletList, mdLink, mdTitledSection, translatedLink } from "./format";
import { escapeMdInline } from "./escape";
import { markdownTwinUrl } from "@/features/meta/domain/urls";

// types
import type { PagePath, PreferredLanguage, Translate } from "@/domain/models";

// constants
import { HOME_PATH } from "@/domain/constants";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";
import { AI_INDEXES, LLMS_TXT_INDEX } from "@/features/meta/domain/discovery";

export const AI_INDEX_MARKDOWN_LINKS: ReadonlyArray<string> = Array.map(AI_INDEXES, ({ name, url }) => mdLink(name, url));

const homeLink = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  translatedLink(STATIC_PAGES[HOME_PATH].label, markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, preferredLanguage), translate);

// Sibling twins for a static page, plus AI indexes (excludes self)
const twinIndexLinks = (pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([
    ...Array.map(
      Array.filter(STATIC_PAGE_PATHS, (path) => path !== pagePath),
      (path) => translatedLink(STATIC_PAGES[path].label, markdownTwinUrl(STATIC_PAGES[path].mdHref, preferredLanguage), translate)
    ),
    ...AI_INDEX_MARKDOWN_LINKS,
  ]);

const detailIndexLinks = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([homeLink(preferredLanguage, translate), ...AI_INDEX_MARKDOWN_LINKS]);

export const pagesSection = (pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdTitledSection(translate("Pages"), twinIndexLinks(pagePath, preferredLanguage, translate));

export const detailPagesSection = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdTitledSection(translate("Pages"), detailIndexLinks(preferredLanguage, translate));

export const deadEndEscapeLine = (preferredLanguage: PreferredLanguage, translate: Translate) => {
  const indexLink = mdLink(LLMS_TXT_INDEX.name, LLMS_TXT_INDEX.url);
  return `${escapeMdInline(translate("See"))} ${homeLink(preferredLanguage, translate)} ${escapeMdInline(translate("or"))} ${indexLink}.`;
};

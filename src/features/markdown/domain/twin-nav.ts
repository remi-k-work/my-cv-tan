// services, features, and other libraries
import { Array } from "effect";
import { msg } from "gt-i18n";
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

// Standalone twins carry their citation target in the body; aggregated documents provide their own Source link
export const canonicalSourceLink = (canonical: string) => mdLink("Canonical HTML", canonical);

const staticTwinLink = (path: PagePath, preferredLanguage: PreferredLanguage, translate: Translate) =>
  translatedLink(STATIC_PAGES[path].label, markdownTwinUrl(STATIC_PAGES[path].mdHref, preferredLanguage), translate);

// Sibling twins for a static page, plus AI indexes (excludes self)
const twinIndexLinks = (pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([
    ...Array.map(
      Array.filter(STATIC_PAGE_PATHS, (path) => path !== pagePath),
      (path) => staticTwinLink(path, preferredLanguage, translate)
    ),
    ...AI_INDEX_MARKDOWN_LINKS,
  ]);

const detailIndexLinks = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([staticTwinLink(HOME_PATH, preferredLanguage, translate), ...AI_INDEX_MARKDOWN_LINKS]);

const navigationSection = (links: string, translate: Translate) => mdTitledSection(translate(msg("Pages")), links);

export const pagesSection = (pagePath: PagePath, preferredLanguage: PreferredLanguage, translate: Translate) =>
  navigationSection(twinIndexLinks(pagePath, preferredLanguage, translate), translate);

export const detailPagesSection = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  navigationSection(detailIndexLinks(preferredLanguage, translate), translate);

export const deadEndEscapeLine = (preferredLanguage: PreferredLanguage, translate: Translate) => {
  const indexLink = mdLink(LLMS_TXT_INDEX.name, LLMS_TXT_INDEX.url);
  return `${escapeMdInline(translate(msg("See")))} ${staticTwinLink(HOME_PATH, preferredLanguage, translate)} ${escapeMdInline(translate(msg("or")))} ${indexLink}.`;
};

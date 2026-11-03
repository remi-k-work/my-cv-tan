// services, features, and other libraries
import { msg } from "gt-tanstack-start";
import { Array } from "effect";
import { STATIC_PAGES, STATIC_PATHS, HOME_PATH, type StaticPageCopy } from "@/features/meta/domain/static-pages";
import { markdownTwinUrl } from "@/features/meta/domain/url";
import { escapeMdInline } from "./text";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";

// constants
import { AI_INDEXES, LLMS_TXT_INDEX } from "@/features/meta/domain/links";
import { mdBulletList, mdLink, translatedLink } from "./blocks";

// Twin document graph cross-links connecting siblings and AI discovery indexes.
export const AI_INDEX_MARKDOWN_LINKS: ReadonlyArray<string> = Array.map(AI_INDEXES, ({ name, url }) => mdLink(name, url));

const HOME_LABEL = STATIC_PAGES[HOME_PATH].label;

// Language-pinned link to the home page twin.
const homeLink = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  translatedLink(HOME_LABEL, markdownTwinUrl(STATIC_PAGES[HOME_PATH].mdHref, preferredLanguage), translate);

// Sibling twin links excluding the current page, plus AI indexes.
export const twinIndexLinks = (copy: StaticPageCopy, translate: Translate) =>
  mdBulletList([
    ...Array.map(
      Array.filter(STATIC_PATHS, (path) => path !== copy.path),
      (path) => translatedLink(STATIC_PAGES[path].label, markdownTwinUrl(STATIC_PAGES[path].mdHref, copy.preferredLanguage), translate)
    ),
    ...AI_INDEX_MARKDOWN_LINKS,
  ]);

// Detail twin navigation links pointing back to home and AI discovery indexes.
export const detailIndexLinks = (preferredLanguage: PreferredLanguage, translate: Translate) =>
  mdBulletList([homeLink(preferredLanguage, translate), ...AI_INDEX_MARKDOWN_LINKS]);

// Escape hatch line for 404 responses directing crawlers to valid index documents.
export const deadEndEscapeLine = (preferredLanguage: PreferredLanguage, translate: Translate) => {
  const indexLink = mdLink(LLMS_TXT_INDEX.name, LLMS_TXT_INDEX.url);

  return `${escapeMdInline(translate(msg("See")))} ${homeLink(preferredLanguage, translate)} ${escapeMdInline(translate(msg("or")))} ${indexLink}.`;
};

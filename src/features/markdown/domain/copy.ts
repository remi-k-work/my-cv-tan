// The context and identity every Markdown twin publishes, declared once so the homepage, the
// subpages and the detail twins cannot each restate them a second way.

// meta (shared)
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/identity";
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/languages";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/pages";

// Identity translate used for the English source documents published in AI indexes.
export const translateSource: Translate = (source) => source;

// English source rendering context (preferredLanguage + identity translate).
export const SOURCE_COPY = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource } as const;

// The identity facts every twin's frontmatter carries, whatever page it describes: the branded
// title, the SEO description, the site as author, the canonical to cite and the page language.
export const twinIdentity = ({
  title,
  description,
  canonical,
  preferredLanguage,
}: {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly preferredLanguage: PreferredLanguage;
}) => ({
  title: BRANDED_TITLE(title),
  description,
  author: SITE_NAME,
  canonical,
  lang: preferredLanguage,
});

// The static twin's identity facts: the shared set plus the page's own kind.
export const pageFacts = (copy: StaticPageCopy) => ({
  ...twinIdentity({
    title: copy.seoTitle,
    description: copy.description,
    canonical: copy.canonical,
    preferredLanguage: copy.preferredLanguage,
  }),
  type: copy.type,
});

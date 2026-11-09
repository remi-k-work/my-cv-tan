// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/models";

// constants
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/constants";
import { DEFAULT_LANGUAGE } from "@/domain/constants";

export const translateSource: Translate = (source) => source;
export const SOURCE_COPY = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource } as const;

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

export const pageFacts = (copy: StaticPageCopy) => ({
  ...twinIdentity({
    title: copy.seoTitle,
    description: copy.description,
    canonical: copy.canonical,
    preferredLanguage: copy.preferredLanguage,
  }),
  type: copy.type,
});

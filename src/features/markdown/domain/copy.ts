// types
import type { PreferredLanguage } from "@/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/models";

// constants
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/constants";

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

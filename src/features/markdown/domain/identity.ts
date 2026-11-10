// constants
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/site";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/models";

// The identity facts every twin shares: the same title template, author and canonical the HTML head publishes
export const twinIdentity = (title: string, description: string, canonical: string, preferredLanguage: PreferredLanguage) =>
  ({
    title: BRANDED_TITLE(title),
    description,
    author: SITE_NAME,
    canonical,
    lang: preferredLanguage,
  }) as const;

export const pageFacts = ({ seoTitle, description, canonical, preferredLanguage, type }: StaticPageCopy) => ({
  ...twinIdentity(seoTitle, description, canonical, preferredLanguage),
  type,
});

// constants
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/site";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/models";

// Even a 404 carries the site's identity, but only a real page may add a canonical or type
export const twinBaseFacts = (title: string, description: string, preferredLanguage: PreferredLanguage) =>
  ({
    title: BRANDED_TITLE(title),
    description,
    author: SITE_NAME,
    lang: preferredLanguage,
  }) as const;

// The identity facts every published twin shares with its HTML head
export const twinIdentity = (title: string, description: string, canonical: string, preferredLanguage: PreferredLanguage) => ({
  ...twinBaseFacts(title, description, preferredLanguage),
  canonical,
});

export const pageFacts = ({ seoTitle, description, canonical, preferredLanguage, type }: StaticPageCopy) => ({
  ...twinIdentity(seoTitle, description, canonical, preferredLanguage),
  type,
});

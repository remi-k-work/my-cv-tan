// services, features, and other libraries
import { pageField } from "@/domain";
import { excerpt } from "@/features/experience/domain";

// types
import type { PagePath, PageTitles } from "@/domain";
import type { StaticPageCopy } from "./models";

// constants
import { CONTACT_MD_HREF, DESCRIPTION, EDUCATION_MD_HREF, HOME_MD_HREF, META_DESCRIPTION_LENGTH, TITLE } from "./constants";
import { absoluteUrl } from "./url";

// Single source of truth for the three static pages: Markdown twin href plus the fallback
// copy used when the loader has no translation. HTML heads (page.ts) and Markdown twins
// (markdown/pages.ts) both resolve through this record, so their meta can never drift apart
export const STATIC_PAGES = {
  "/": { mdHref: HOME_MD_HREF, fallbackHeading: TITLE, fallbackIntro: DESCRIPTION },
  "/education": { mdHref: EDUCATION_MD_HREF, fallbackHeading: "Education", fallbackIntro: "Education & certificates." },
  "/contact": { mdHref: CONTACT_MD_HREF, fallbackHeading: "Contact", fallbackIntro: "Get in touch via the contact form." },
} as const satisfies Record<PagePath, { readonly mdHref: string; readonly fallbackHeading: string; readonly fallbackIntro: string }>;

// Localized copy of one static page: translated heading/intro when the loader has them, the
// fallback otherwise; the intro is capped once here so every consumer shares one description
export const staticPageCopy = (pageTitles: PageTitles, pagePath: PagePath): StaticPageCopy => {
  const { fallbackHeading, fallbackIntro } = STATIC_PAGES[pagePath];
  const intro = pageField(pageTitles, pagePath, "intro", fallbackIntro);

  return {
    title: pageField(pageTitles, pagePath, "heading", fallbackHeading),
    intro,
    description: excerpt(intro, META_DESCRIPTION_LENGTH),
    canonical: absoluteUrl(pagePath),
  };
};

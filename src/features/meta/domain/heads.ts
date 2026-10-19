// services, features, and other libraries
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { absoluteUrl, canonicalLink, markdownAlternateLink, experienceMarkdownPath, experiencePath } from "./url";
import { experienceShareImage } from "./images";
import { socialMeta } from "./social";
import { contactJsonLd } from "./json-ld/contact";
import { educationJsonLd } from "./json-ld/education";
import { experienceJsonLd } from "./json-ld/experience";
import { homeJsonLd } from "./json-ld/home";
import { staticPageCopy } from "./static-pages";

// types
import type { EducationHeadInput, ExperienceHeadInput, HomeHeadInput, PageHeadInput, SocialMetaInput, StaticPageHeadInput } from "./models";

// constants
import { GLOBAL_SOCIAL_IMAGE, META_DESCRIPTION_LENGTH, BRANDED_TITLE, INDEXABLE_ROBOTS } from "./constants";
import { STATIC_PAGES } from "./static-pages";

// Complete data opts into indexing: one shared block keeps title, robots and social tags consistent;
// incomplete loader responses inherit the root noindex policy instead
const indexableMeta = (input: SocialMetaInput) => [
  { title: BRANDED_TITLE(input.title) },
  { name: "description", content: input.description },
  { name: "robots", content: INDEXABLE_ROBOTS },
  ...socialMeta(input),
];

// Static pages share localized visible copy, authored search metadata, canonical links,
// and JSON-LD; Markdown twins use the same source through staticPageCopy
const staticPageHead = ({ pageTitles, preferredLanguage, pagePath, jsonLd }: StaticPageHeadInput) => {
  // Resolve once so the HTML head and Markdown twin share the same canonical and summary
  const { heading, seoTitle, description, canonical } = staticPageCopy(pageTitles, pagePath, preferredLanguage);

  return {
    meta: indexableMeta({ title: seoTitle, description, path: pagePath, image: GLOBAL_SOCIAL_IMAGE, preferredLanguage }),
    links: [canonicalLink(canonical), markdownAlternateLink(STATIC_PAGES[pagePath].mdHref)],
    scripts: [jsonLd({ pageName: heading, description, preferredLanguage })],
  };
};

export const homeHead = ({ experienceList, ...page }: HomeHeadInput) =>
  staticPageHead({ ...page, pagePath: "/", jsonLd: (copy) => homeJsonLd({ ...copy, experienceList }) });

export const educationHead = ({ educationList, ...page }: EducationHeadInput) =>
  staticPageHead({ ...page, pagePath: "/education", jsonLd: (copy) => educationJsonLd({ ...copy, educationList }) });

export const contactHead = (page: PageHeadInput) => staticPageHead({ ...page, pagePath: "/contact", jsonLd: contactJsonLd });

// Detail head always canonicalizes to the clean /{slug} URL derived from experience.slug, so stray query parameters never become duplicates
export const experienceHead = ({ experience, preferredLanguage }: ExperienceHeadInput) => {
  const { slug, txt, imageName } = experience;

  const path = experiencePath(slug);
  const headline = experienceHeadline(experience, preferredLanguage);
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  // The share image resolves through images.ts, the same source the JSON-LD image uses
  const image = experienceShareImage(imageName);

  return {
    meta: indexableMeta({ title: headline, description, path, image, twitterImage: GLOBAL_SOCIAL_IMAGE, preferredLanguage }),
    links: [canonicalLink(absoluteUrl(path)), markdownAlternateLink(experienceMarkdownPath(slug))],
    scripts: [experienceJsonLd({ experience, preferredLanguage })],
  };
};

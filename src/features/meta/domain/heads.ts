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
import type { JsonLdScript, EducationHeadInput, ExperienceHeadInput, HomeHeadInput, PageHeadInput, SocialMetaInput, StaticPageHeadInput } from "./models";

// constants
import { GLOBAL_SOCIAL_IMAGE, META_DESCRIPTION_LENGTH, BRANDED_TITLE, INDEXABLE_ROBOTS } from "./constants";

type PageHeadSpec = SocialMetaInput & {
  readonly markdownPath: string;
  readonly jsonLd: JsonLdScript;
};

// Complete data opts into indexing: one shared block keeps title, robots, social tags,
// canonical and the Markdown twin consistent; incomplete loader responses inherit the
// root noindex policy instead
const pageHead = ({ markdownPath, jsonLd, ...social }: PageHeadSpec) => ({
  meta: [
    { title: BRANDED_TITLE(social.title) },
    { name: "description", content: social.description },
    { name: "robots", content: INDEXABLE_ROBOTS },
    ...socialMeta(social),
  ],
  links: [canonicalLink(absoluteUrl(social.path)), markdownAlternateLink(markdownPath)],
  scripts: [jsonLd],
});

// Static pages share localized visible copy, authored search metadata, canonical links,
// and JSON-LD; Markdown twins use the same source through staticPageCopy
const staticPageHead = ({ pageTitles, preferredLanguage, pagePath, jsonLd }: StaticPageHeadInput) => {
  const copy = staticPageCopy(pageTitles, pagePath, preferredLanguage);

  return pageHead({
    title: copy.seoTitle,
    description: copy.description,
    path: copy.path,
    markdownPath: copy.mdHref,
    image: GLOBAL_SOCIAL_IMAGE,
    preferredLanguage: copy.preferredLanguage,
    jsonLd: jsonLd(copy),
  });
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

  return pageHead({
    title: experienceHeadline(experience, preferredLanguage),
    description: excerpt(txt, META_DESCRIPTION_LENGTH),
    path,
    markdownPath: experienceMarkdownPath(slug),
    // The share image resolves through images.ts, the same source the JSON-LD image uses
    image: experienceShareImage(imageName),
    twitterImage: GLOBAL_SOCIAL_IMAGE,
    preferredLanguage,
    jsonLd: experienceJsonLd({ experience, preferredLanguage }),
  });
};

// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { pageField } from "@/domain";
import { excerpt } from "@/features/experience/domain";
import { canonicalLink, experienceImageUrl, markdownAlternateLink } from "./helpers";
import { socialMeta } from "./social";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./json-ld";

// types
import type { SocialImage } from "./models";
import type { EducationHeadInput, ExperienceHeadInput, HomeHeadInput, PageHeadInput } from "./models";
import type { PagePath } from "@/domain";

// constants
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain";
import {
  BASE_KEYWORDS,
  CONTACT_MD_HREF,
  DESCRIPTION,
  EDUCATION_MD_HREF,
  EXPERIENCE_MD_HREF,
  GLOBAL_SOCIAL_IMAGE,
  HOME_MD_HREF,
  META_DESCRIPTION_LENGTH,
  SITE_NAME,
  TITLE,
} from "./constants";

// Shared head for content pages: complete data opts into indexing; incomplete responses inherit the root noindex policy instead
const localizedPageHead = (
  pageTitles: PageHeadInput["pageTitles"],
  pagePath: PagePath,
  mdHref: string,
  keywords: ReadonlyArray<string>,
  preferredLanguage: PageHeadInput["preferredLanguage"]
) => {
  const title = pageField(pageTitles, pagePath, "heading", TITLE);
  const description = excerpt(pageField(pageTitles, pagePath, "intro", DESCRIPTION), META_DESCRIPTION_LENGTH);

  return {
    title,
    description,
    head: {
      meta: [
        { title: `${SITE_NAME} ● ${title}` },
        { name: "description", content: description },
        { name: "keywords", content: keywords.join(", ") },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        ...socialMeta({ title, description, path: pagePath, image: GLOBAL_SOCIAL_IMAGE, ogType: "website", preferredLanguage }),
      ],
      links: [canonicalLink(pagePath), markdownAlternateLink(mdHref)],
    },
  };
};

export const homeListHead = ({ pageTitles, experienceList, preferredLanguage }: HomeHeadInput) => {
  const { title, description, head } = localizedPageHead(pageTitles, "/", HOME_MD_HREF, BASE_KEYWORDS, preferredLanguage);
  return { ...head, scripts: [homeJsonLd({ title, description, experienceList, preferredLanguage })] };
};

export const educationHead = ({ pageTitles, educationList, preferredLanguage }: EducationHeadInput) => {
  const { title, head } = localizedPageHead(pageTitles, "/education", EDUCATION_MD_HREF, [...BASE_KEYWORDS, "education", "certificates"], preferredLanguage);
  return { ...head, scripts: [educationJsonLd({ title, educationList, preferredLanguage })] };
};

export const contactHead = ({ pageTitles, preferredLanguage }: PageHeadInput) => {
  const { title, description, head } = localizedPageHead(pageTitles, "/contact", CONTACT_MD_HREF, [...BASE_KEYWORDS, "contact", "Rzeszów"], preferredLanguage);
  return { ...head, scripts: [contactJsonLd({ title, description, preferredLanguage })] };
};

// Detail head always canonicalizes to the clean /{slug} URL, so stray query parameters never become duplicates
export const experienceHead = ({ slug, experience, preferredLanguage }: ExperienceHeadInput) => {
  const { role, company, txt, imageName, skillsUsed } = experience;

  const path = `/${slug}`;
  const title = `${SITE_NAME} ● ${role} at ${company}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);
  const keywords = pipe([...BASE_KEYWORDS, ...skillsUsed], Array.dedupe, Array.join(", "));
  const image: SocialImage = pipe(
    experienceImageUrl(imageName),
    Option.map((src) => ({ src, mime: "image/webp" as const, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT })),
    Option.getOrElse(() => GLOBAL_SOCIAL_IMAGE)
  );
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "article:author", content: SITE_NAME },
      { property: "article:tag", content: skillsUsed.join(", ") },
      ...socialMeta({ title, description, path, image, ogType: "article", twitterImage: GLOBAL_SOCIAL_IMAGE, preferredLanguage }),
    ],
    links: [canonicalLink(path), markdownAlternateLink(EXPERIENCE_MD_HREF(slug))],
    scripts: [experienceJsonLd({ slug, experience, preferredLanguage })],
  };
};

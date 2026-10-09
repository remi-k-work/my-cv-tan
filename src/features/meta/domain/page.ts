// services, features, and other libraries
import { Option, pipe } from "effect";
import { pageField } from "@/domain";
import { excerpt } from "@/features/experience/domain";
import { canonicalLink, experienceImageUrl, experienceMarkdownPath, experiencePath, markdownAlternateLink } from "./helpers";
import { socialMeta } from "./social";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./json-ld";

// types
import type { SocialImage } from "./models";
import type { EducationHeadInput, ExperienceHeadInput, HomeHeadInput, PageHeadInput } from "./models";
import type { PagePath } from "@/domain";

// constants
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain";
import { CONTACT_MD_HREF, DESCRIPTION, EDUCATION_MD_HREF, GLOBAL_SOCIAL_IMAGE, HOME_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME, TITLE } from "./constants";

// Shared head for content pages: complete data opts into indexing; incomplete responses inherit the root noindex policy instead
const localizedPageHead = (
  pageTitles: PageHeadInput["pageTitles"],
  pagePath: PagePath,
  mdHref: string,
  preferredLanguage: PageHeadInput["preferredLanguage"]
) => {
  const title = pageField(pageTitles, pagePath, "heading", TITLE);
  const description = excerpt(pageField(pageTitles, pagePath, "intro", DESCRIPTION), META_DESCRIPTION_LENGTH);

  // title/description are internal values callers feed into their JSON-LD builders;
  // meta/links are the TanStack head contract (flat shape, no nested `head` key)
  return {
    title,
    description,
    meta: [
      { title: `${SITE_NAME} ● ${title}` },
      { name: "description", content: description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      ...socialMeta({ title, description, path: pagePath, image: GLOBAL_SOCIAL_IMAGE, ogType: "website", preferredLanguage }),
    ],
    links: [canonicalLink(pagePath), markdownAlternateLink(mdHref)],
  };
};

export const homeHead = ({ pageTitles, experienceList, preferredLanguage }: HomeHeadInput) => {
  const { title, description, meta, links } = localizedPageHead(pageTitles, "/", HOME_MD_HREF, preferredLanguage);
  return { meta, links, scripts: [homeJsonLd({ title, description, experienceList, preferredLanguage })] };
};

export const educationHead = ({ pageTitles, educationList, preferredLanguage }: EducationHeadInput) => {
  const { title, meta, links } = localizedPageHead(pageTitles, "/education", EDUCATION_MD_HREF, preferredLanguage);
  return { meta, links, scripts: [educationJsonLd({ title, educationList, preferredLanguage })] };
};

export const contactHead = ({ pageTitles, preferredLanguage }: PageHeadInput) => {
  const { title, description, meta, links } = localizedPageHead(pageTitles, "/contact", CONTACT_MD_HREF, preferredLanguage);
  return { meta, links, scripts: [contactJsonLd({ title, description, preferredLanguage })] };
};

// Detail head always canonicalizes to the clean /{slug} URL, so stray query parameters never become duplicates
export const experienceHead = ({ slug, experience, preferredLanguage }: ExperienceHeadInput) => {
  const { role, company, txt, imageName } = experience;

  const path = experiencePath(slug);
  const title = `${SITE_NAME} ● ${role} at ${company}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);
  const image: SocialImage = pipe(
    experienceImageUrl(imageName),
    Option.map((src) => ({ src, mime: "image/webp" as const, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT })),
    Option.getOrElse(() => GLOBAL_SOCIAL_IMAGE)
  );
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      ...socialMeta({ title, description, path, image, ogType: "website", twitterImage: GLOBAL_SOCIAL_IMAGE, preferredLanguage }),
    ],
    links: [canonicalLink(path), markdownAlternateLink(experienceMarkdownPath(slug))],
    scripts: [experienceJsonLd({ slug, experience, preferredLanguage })],
  };
};

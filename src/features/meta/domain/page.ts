// services, features, and other libraries
import { Option, pipe } from "effect";
import { pageField } from "@/domain";
import { experienceHeadline, excerpt } from "@/features/experience/domain";
import { canonicalLink, MARKDOWN_TWIN_HREF, markdownAlternateLink, experienceImageUrl, experienceMarkdownPath, experiencePath } from "./url";
import { socialMeta } from "./social";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./json-ld";

// types
import type { EducationHeadInput, ExperienceHeadInput, HomeHeadInput, PageHeadInput, SocialImage, SocialMetaInput, StaticPageHeadInput } from "./models";

// constants
import { SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT } from "@/features/experience/domain";
import { DESCRIPTION, GLOBAL_SOCIAL_IMAGE, META_DESCRIPTION_LENGTH, TITLE, brandedTitle } from "./constants";

// Complete data opts into indexing: one shared block keeps <title>, robots and social tags
// consistent; the bare heading goes to og:title so every card renders the same way.
// Incomplete loader responses inherit the root noindex policy instead.
const indexableMeta = (input: SocialMetaInput) => [
  { title: brandedTitle(input.title) },
  { name: "description", content: input.description },
  { name: "robots", content: "index, follow, max-image-preview:large" },
  ...socialMeta(input),
];

// Shared builder for the three static pages: localized copy with per-page fallbacks, one
// indexing meta block, canonical + Markdown twin links, and the JSON-LD fed with the same copy
const staticPageHead = ({ pageTitles, preferredLanguage, pagePath, fallbackHeading, fallbackIntro, jsonLd }: StaticPageHeadInput) => {
  const title = pageField(pageTitles, pagePath, "heading", fallbackHeading);
  // The same capped intro feeds the meta description and every social card
  const description = excerpt(pageField(pageTitles, pagePath, "intro", fallbackIntro), META_DESCRIPTION_LENGTH);

  return {
    meta: indexableMeta({ title, description, path: pagePath, image: GLOBAL_SOCIAL_IMAGE, preferredLanguage }),
    links: [canonicalLink(pagePath), markdownAlternateLink(MARKDOWN_TWIN_HREF[pagePath])],
    scripts: [jsonLd({ title, description, preferredLanguage })],
  };
};

export const homeHead = ({ experienceList, ...page }: HomeHeadInput) =>
  staticPageHead({
    ...page,
    pagePath: "/",
    fallbackHeading: TITLE,
    fallbackIntro: DESCRIPTION,
    jsonLd: (copy) => homeJsonLd({ ...copy, experienceList }),
  });

export const educationHead = ({ educationList, ...page }: EducationHeadInput) =>
  staticPageHead({
    ...page,
    pagePath: "/education",
    fallbackHeading: "Education",
    fallbackIntro: "Education & certificates.",
    jsonLd: (copy) => educationJsonLd({ ...copy, educationList }),
  });

export const contactHead = (page: PageHeadInput) =>
  staticPageHead({
    ...page,
    pagePath: "/contact",
    fallbackHeading: "Contact",
    fallbackIntro: "Get in touch via the contact form.",
    jsonLd: contactJsonLd,
  });

// Detail head always canonicalizes to the clean /{slug} URL derived from experience.slug,
// so stray query parameters never become duplicates
export const experienceHead = ({ experience, preferredLanguage }: ExperienceHeadInput) => {
  const { slug, txt, imageName } = experience;

  const path = experiencePath(slug);
  const headline = experienceHeadline(experience, preferredLanguage);
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);
  // og:image carries the webp screenshot when one exists; X/Twitter needs jpeg/png, so it always gets the global image
  const image: SocialImage = pipe(
    experienceImageUrl(imageName),
    Option.map((src) => ({ src, mime: "image/webp" as const, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT })),
    Option.getOrElse(() => GLOBAL_SOCIAL_IMAGE)
  );
  return {
    meta: indexableMeta({ title: headline, description, path, image, twitterImage: GLOBAL_SOCIAL_IMAGE, preferredLanguage }),
    links: [canonicalLink(path), markdownAlternateLink(experienceMarkdownPath(slug))],
    scripts: [experienceJsonLd({ experience, preferredLanguage })],
  };
};

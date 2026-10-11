// services, features, and other libraries
import { Option, pipe } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain";
import { absoluteUrl, canonicalLink, markdownAlternateLink, experienceImageUrl, experienceMarkdownPath, experiencePath } from "./url";
import { socialMeta } from "./social";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./json-ld";
import { staticPageCopy } from "./static-pages";

// types
import type { EducationHeadInput, ExperienceHeadInput, HomeHeadInput, PageHeadInput, SocialImage, SocialMetaInput, StaticPageHeadInput } from "./models";

// constants
import { SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT } from "@/features/experience/domain";
import { GLOBAL_SOCIAL_IMAGE, META_DESCRIPTION_LENGTH, BRANDED_TITLE } from "./constants";
import { STATIC_PAGES } from "./static-pages";

// Complete data opts into indexing: one shared block keeps title, robots and social tags consistent
// max-snippet:-1 leaves AI overviews and citation surfaces unconstrained; incomplete loader
// responses inherit the root noindex policy instead
const indexableMeta = (input: SocialMetaInput) => [
  { title: BRANDED_TITLE(input.title) },
  { name: "description", content: input.description },
  { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large" },
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
  staticPageHead({
    ...page,
    pagePath: "/",
    jsonLd: (copy) => homeJsonLd({ ...copy, experienceList }),
  });

export const educationHead = ({ educationList, ...page }: EducationHeadInput) =>
  staticPageHead({
    ...page,
    pagePath: "/education",
    jsonLd: (copy) => educationJsonLd({ ...copy, educationList }),
  });

export const contactHead = (page: PageHeadInput) => staticPageHead({ ...page, pagePath: "/contact", jsonLd: contactJsonLd });

// Detail head always canonicalizes to the clean /{slug} URL derived from experience.slug, so stray query parameters never become duplicates
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
    links: [canonicalLink(absoluteUrl(path)), markdownAlternateLink(experienceMarkdownPath(slug))],
    scripts: [experienceJsonLd({ experience, preferredLanguage })],
  };
};

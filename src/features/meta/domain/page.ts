// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl, canonicalLink, hreflangLinks, markdownAlternateLink } from "./helpers";
import { globalSocialImage, socialMeta } from "./social";
import { contactFaqJsonLd, educationCredentialsJsonLd, experienceBreadcrumbJsonLd, experienceJsonLd, homeItemListJsonLd } from "./json-ld";

// types
import type { PagePath, PageTitles } from "@/domain";
import type { Experience } from "@/features/experience/domain";
import type { DocumentHead } from "./constants";

// constants
import {
  BASE_KEYWORDS,
  CONTACT_MD_HREF,
  DESCRIPTION,
  EDUCATION_MD_HREF,
  HOME_MD_HREF,
  META_DESCRIPTION_LENGTH,
  SCREENSHOT_HEIGHT,
  SCREENSHOT_WIDTH,
  SITE_NAME,
  TITLE,
  experienceMdHref,
} from "./constants";

// Localized document head with a static fallback when loader data is missing
const localizedPageHead = (pageTitles: PageTitles | null, pagePath: PagePath, mdHref: string, keywords: ReadonlyArray<string> = BASE_KEYWORDS) => {
  const pageTitle = Option.fromNullishOr(pageTitles).pipe(Option.map((titles) => titles[pagePath]));

  const title = pageTitle.pipe(
    Option.map(({ heading }) => heading),
    Option.getOrElse(() => TITLE)
  );

  const description = pageTitle.pipe(
    Option.map(({ intro }) => excerpt(intro, META_DESCRIPTION_LENGTH)),
    Option.getOrElse(() => DESCRIPTION)
  );

  return {
    meta: [
      { title: `${SITE_NAME} ● ${title}` },
      { name: "description", content: description },
      // Shared tags (author, robots) are inherited from the root head; only
      // page-specific values and overrides belong here.
      { name: "keywords", content: keywords.join(", ") },
      ...socialMeta({ title, description, path: pagePath, image: globalSocialImage(), ogType: "website" }),
    ],
    links: [canonicalLink(pagePath), ...hreflangLinks(pagePath), markdownAlternateLink(mdHref)],
  } as const satisfies DocumentHead;
};

export const homeListHead = (pageTitles: PageTitles | null, experienceList: ReadonlyArray<Experience> | null = null) => {
  const base = localizedPageHead(pageTitles, "/", HOME_MD_HREF);
  const itemList = pipe(
    Option.fromNullishOr(experienceList),
    Option.filter((list) => list.length > 0),
    Option.map((list) => homeItemListJsonLd(list))
  );

  return {
    ...base,
    scripts: Option.isSome(itemList) ? [itemList.value] : [],
  } as const satisfies DocumentHead;
};
export const educationHead = (
  pageTitles: PageTitles | null,
  educationList: ReadonlyArray<{ readonly name: string; readonly info: string; readonly location: string }> | null = null
) => {
  const base = localizedPageHead(pageTitles, "/education", EDUCATION_MD_HREF, [...BASE_KEYWORDS, "education", "certificates"]);
  const credentials = pipe(
    Option.fromNullishOr(educationList),
    Option.filter((list) => list.length > 0),
    Option.map((list) => educationCredentialsJsonLd(list))
  );

  return {
    ...base,
    scripts: Option.isSome(credentials) ? [credentials.value] : [],
  } as const satisfies DocumentHead;
};
export const contactHead = (pageTitles: PageTitles | null) => {
  const base = localizedPageHead(pageTitles, "/contact", CONTACT_MD_HREF, [...BASE_KEYWORDS, "contact", "Rzeszów"]);
  return { ...base, scripts: [contactFaqJsonLd()] } as const satisfies DocumentHead;
};

// Detail head always canonicalizes to the clean /{slug} URL, so stray query
// parameters never become duplicates
export const experienceHead = (slug: string, experience: Experience) => {
  const { role, company, txt, imageName, skillsUsed, year } = experience;

  const path = `/${slug}`;
  const title = `${SITE_NAME} ● ${role} at ${company}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);
  const keywords = pipe([...BASE_KEYWORDS, ...skillsUsed], Array.dedupe, Array.join(", "));
  const image = pipe(
    Option.fromNullishOr(imageName),
    Option.filter((name) => name.length > 0),
    Option.map((name) => ({ src: absoluteUrl(`/images/${name}-a.webp`), mime: "image/webp" as const, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT })),
    Option.getOrElse(globalSocialImage)
  );

  return {
    meta: [
      { title },
      { name: "description", content: description },
      // Shared tags (author, robots) are inherited from the root head (see above).
      { name: "keywords", content: keywords },
      { property: "article:author", content: SITE_NAME },
      { property: "article:published_time", content: year },
      { property: "article:tag", content: skillsUsed.join(", ") },
      ...socialMeta({ title, description, path, image, ogType: "article", twitterImage: globalSocialImage() }),
    ],
    links: [canonicalLink(path), ...hreflangLinks(path), markdownAlternateLink(experienceMdHref(slug))],
    scripts: [experienceJsonLd(slug, experience), experienceBreadcrumbJsonLd(slug, experience)],
  } as const satisfies DocumentHead;
};

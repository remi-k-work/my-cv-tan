// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { pageField } from "@/domain";
import { excerpt } from "@/features/experience/domain";
import { canonicalLink, experienceImageUrl, hreflangLinks, markdownAlternateLink, yearToIso } from "./helpers";
import { socialMeta } from "./social";
import { contactFaqJsonLd, educationListJsonLd, experienceJsonLd, homeItemListJsonLd } from "./json-ld";

// types
import type { DocumentHead, SocialImage } from "./models";
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

// Localized document head shared by the static pages; shared tags (author, robots) are
// inherited from the root head, so only page-specific values belong here.
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
    meta: [
      { title: `${SITE_NAME} ● ${title}` },
      { name: "description", content: description },
      { name: "keywords", content: keywords.join(", ") },
      ...socialMeta({ title, description, path: pagePath, image: GLOBAL_SOCIAL_IMAGE, ogType: "website", preferredLanguage }),
    ],
    links: [canonicalLink(pagePath), ...hreflangLinks(pagePath), markdownAlternateLink(mdHref)],
  } as const satisfies DocumentHead;
};

// Emits the structured-data script only when the list decoded and is non-empty
const listJsonLdScript = <T>(list: ReadonlyArray<T> | null, build: (items: ReadonlyArray<T>) => { type: string; children: string }) =>
  pipe(
    Option.fromNullishOr(list),
    Option.filter((items) => items.length > 0),
    Option.map(build),
    Option.match({
      onNone: () => [] as const,
      onSome: (script) => [script] as const,
    })
  );

export const homeListHead = ({ pageTitles, experienceList, preferredLanguage }: HomeHeadInput) => {
  const head = localizedPageHead(pageTitles, "/", HOME_MD_HREF, BASE_KEYWORDS, preferredLanguage);
  return { ...head, scripts: listJsonLdScript(experienceList, homeItemListJsonLd) } as const satisfies DocumentHead;
};

export const educationHead = ({ pageTitles, educationList, preferredLanguage }: EducationHeadInput) => {
  const head = localizedPageHead(pageTitles, "/education", EDUCATION_MD_HREF, [...BASE_KEYWORDS, "education", "certificates"], preferredLanguage);
  return { ...head, scripts: listJsonLdScript(educationList, educationListJsonLd) } as const satisfies DocumentHead;
};

export const contactHead = ({ pageTitles, preferredLanguage }: PageHeadInput) => {
  const head = localizedPageHead(pageTitles, "/contact", CONTACT_MD_HREF, [...BASE_KEYWORDS, "contact", "Rzeszów"], preferredLanguage);
  return { ...head, scripts: [contactFaqJsonLd()] as const } as const satisfies DocumentHead;
};

// Detail head always canonicalizes to the clean /{slug} URL, so stray query
// parameters never become duplicates
export const experienceHead = ({ slug, experience, preferredLanguage }: ExperienceHeadInput) => {
  const { role, company, txt, imageName, skillsUsed, year } = experience;

  const path = `/${slug}`;
  const title = `${SITE_NAME} ● ${role} at ${company}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);
  const keywords = pipe([...BASE_KEYWORDS, ...skillsUsed], Array.dedupe, Array.join(", "));
  const image: SocialImage = pipe(
    experienceImageUrl(imageName),
    Option.map((src) => ({ src, mime: "image/webp" as const, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT })),
    Option.getOrElse(() => GLOBAL_SOCIAL_IMAGE)
  );
  // article:published_time demands ISO 8601; prose year labels ("Too Long") are omitted rather than emitted invalid
  const publishedTime = pipe(
    yearToIso(year),
    Option.match({
      onNone: () => [] as const,
      onSome: (iso) => [{ property: "article:published_time", content: iso }] as const,
    })
  );

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { property: "article:author", content: SITE_NAME },
      ...publishedTime,
      { property: "article:tag", content: skillsUsed.join(", ") },
      ...socialMeta({ title, description, path, image, ogType: "article", twitterImage: GLOBAL_SOCIAL_IMAGE, preferredLanguage }),
    ],
    links: [canonicalLink(path), ...hreflangLinks(path), markdownAlternateLink(EXPERIENCE_MD_HREF(slug))],
    scripts: [experienceJsonLd({ slug, experience, preferredLanguage })],
  } as const satisfies DocumentHead;
};

// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt } from "@/features/experience/domain";
import { canonicalLink, experienceImageUrl, hreflangLinks, markdownAlternateLink, yearToIso } from "./helpers";
import { socialMeta } from "./social";
import { contactFaqJsonLd, educationListJsonLd, experienceBreadcrumbJsonLd, experienceJsonLd, homeItemListJsonLd } from "./json-ld";

// types
import type { EducationList } from "@/features/education/domain";
import type { PagePath, PageTitles } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { DocumentHead, SocialImage } from "./models";

// constants
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain";
import {
  BASE_KEYWORDS,
  CONTACT_MD_HREF,
  DESCRIPTION,
  EDUCATION_MD_HREF,
  HOME_MD_HREF,
  META_DESCRIPTION_LENGTH,
  SITE_NAME,
  TITLE,
  EXPERIENCE_MD_HREF,
  GLOBAL_SOCIAL_IMAGE,
} from "./constants";

// Localized page title/intro with a static fallback when loader data is missing or partial
const pageField = (pageTitles: PageTitles | null, pagePath: PagePath, key: "heading" | "intro", fallback: string) =>
  pipe(
    Option.fromNullishOr(pageTitles),
    Option.flatMap((titles) => Option.fromNullishOr(titles[pagePath])),
    Option.map((page) => page[key]),
    Option.getOrElse(() => fallback)
  );

// Localized document head shared by the static pages; shared tags (author, robots) are
// inherited from the root head, so only page-specific values belong here.
const localizedPageHead = (pageTitles: PageTitles | null, pagePath: PagePath, mdHref: string, keywords: ReadonlyArray<string> = BASE_KEYWORDS) => {
  const title = pageField(pageTitles, pagePath, "heading", TITLE);
  const description = excerpt(pageField(pageTitles, pagePath, "intro", DESCRIPTION), META_DESCRIPTION_LENGTH);

  return {
    meta: [
      { title: `${SITE_NAME} ● ${title}` },
      { name: "description", content: description },
      { name: "keywords", content: keywords.join(", ") },
      ...socialMeta({ title, description, path: pagePath, image: GLOBAL_SOCIAL_IMAGE, ogType: "website" }),
    ],
    links: [canonicalLink(pagePath), ...hreflangLinks(pagePath), markdownAlternateLink(mdHref)],
  } as const satisfies DocumentHead;
};

// Emits the structured-data script only when the list decoded and is non-empty
const listScript = <T>(list: ReadonlyArray<T> | null, build: (items: ReadonlyArray<T>) => { type: string; children: string }) =>
  pipe(
    Option.fromNullishOr(list),
    Option.filter((items) => items.length > 0),
    Option.map(build),
    Option.match({
      onNone: () => [] as const,
      onSome: (script) => [script] as const,
    })
  );

export const homeListHead = (pageTitles: PageTitles | null, experienceList: ExperienceList | null = null) =>
  ({
    ...localizedPageHead(pageTitles, "/", HOME_MD_HREF),
    scripts: listScript(experienceList, homeItemListJsonLd),
  }) as const satisfies DocumentHead;

export const educationHead = (pageTitles: PageTitles | null, educationList: EducationList | null = null) =>
  ({
    ...localizedPageHead(pageTitles, "/education", EDUCATION_MD_HREF, [...BASE_KEYWORDS, "education", "certificates"]),
    scripts: listScript(educationList, educationListJsonLd),
  }) as const satisfies DocumentHead;

export const contactHead = (pageTitles: PageTitles | null) =>
  ({
    ...localizedPageHead(pageTitles, "/contact", CONTACT_MD_HREF, [...BASE_KEYWORDS, "contact", "Rzeszów"]),
    scripts: [contactFaqJsonLd()] as const,
  }) as const satisfies DocumentHead;

// Detail head always canonicalizes to the clean /{slug} URL, so stray query
// parameters never become duplicates
export const experienceHead = (slug: string, experience: Experience) => {
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
      ...socialMeta({ title, description, path, image, ogType: "article", twitterImage: GLOBAL_SOCIAL_IMAGE }),
    ],
    links: [canonicalLink(path), ...hreflangLinks(path), markdownAlternateLink(EXPERIENCE_MD_HREF(slug))],
    scripts: [experienceJsonLd(slug, experience), experienceBreadcrumbJsonLd(slug, experience)],
  } as const satisfies DocumentHead;
};

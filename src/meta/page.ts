// services, features, and other libraries
import { Option, pipe } from "effect";
import { excerpt } from "@/domain";
import { absoluteUrl, canonicalLink, hreflangLinks } from "./helpers";
import { globalSocialImage, socialMeta } from "./social";
import { experienceBreadcrumbJsonLd, experienceJsonLd } from "./json-ld";

// types
import type { Experience, PagePath, PageTitles } from "@/domain";
import type { DocumentHead } from "./constants";

// constants
import { DESCRIPTION, META_DESCRIPTION_LENGTH, SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH, SITE_NAME, TITLE } from "./constants";

// Localized document head with a static fallback when loader data is missing
const localizedPageHead = (pageTitles: PageTitles | null, pagePath: PagePath) => {
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
      ...socialMeta({ title, description, path: pagePath, image: globalSocialImage(), ogType: "website" }),
    ],
    links: [canonicalLink(pagePath), ...hreflangLinks(pagePath)],
  } as const satisfies DocumentHead;
};

export const homeListHead = (pageTitles: PageTitles | null) => localizedPageHead(pageTitles, "/");
export const educationHead = (pageTitles: PageTitles | null) => localizedPageHead(pageTitles, "/education");
export const contactHead = (pageTitles: PageTitles | null) => localizedPageHead(pageTitles, "/contact");

// Detail head always canonicalizes to the clean /{slug} URL, so stray query
// parameters never become duplicates
export const experienceHead = (slug: string, experience: Experience) => {
  const { role, company, txt, imageName } = experience;

  const path = `/${slug}`;
  const title = `${SITE_NAME} ● ${role} at ${company}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);
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
      { name: "author", content: SITE_NAME },
      ...socialMeta({ title, description, path, image, ogType: "article", twitterImage: globalSocialImage() }),
    ],
    links: [canonicalLink(path), ...hreflangLinks(path)],
    scripts: [experienceJsonLd(slug, experience), experienceBreadcrumbJsonLd(slug, experience)],
  } as const satisfies DocumentHead;
};

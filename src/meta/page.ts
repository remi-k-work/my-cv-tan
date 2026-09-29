// services, features, and other libraries
import { Option, pipe } from "effect";
import { excerpt } from "@/domain";
import { absoluteUrl, canonicalLink, hreflangLinks } from "./helpers";
import { socialMeta } from "./social";
import { experienceJsonLd } from "./json-ld";

// types
import type { Experience, PagePath, PageTitles } from "@/domain";
import type { DocumentHead } from "./constants";

// constants
import { DESCRIPTION, GLOBAL_IMAGE, SITE_NAME, TITLE } from "./constants";

// Localized document head with a static fallback when loader data is missing
const localizedPageHead = (pageTitles: PageTitles | null, pagePath: PagePath) => {
  const pageTitle = Option.fromNullishOr(pageTitles).pipe(Option.map((titles) => titles[pagePath]));

  const title = pageTitle.pipe(
    Option.map(({ heading }) => heading),
    Option.getOrElse(() => TITLE)
  );

  const description = pageTitle.pipe(
    Option.map(({ intro }) => excerpt(intro, 160)),
    Option.getOrElse(() => DESCRIPTION)
  );

  return {
    meta: [
      { title: `${SITE_NAME} ● ${title}` },
      { name: "description", content: description },
      ...socialMeta({ title, description, path: pagePath, image: GLOBAL_IMAGE, ogType: "website" }),
    ],
    links: [canonicalLink(pagePath), ...hreflangLinks(pagePath)],
  } as const satisfies DocumentHead;
};

export const homeListHead = (pageTitles: PageTitles | null) => localizedPageHead(pageTitles, "/");
export const educationHead = (pageTitles: PageTitles | null) => localizedPageHead(pageTitles, "/education");
export const contactHead = (pageTitles: PageTitles | null) => localizedPageHead(pageTitles, "/contact");

// Detail head always canonicalizes to the clean /{slug} URL, so ?modal=true never becomes a duplicate
export const experienceHead = (slug: string, experience: Experience) => {
  const { role, company, txt, imageName } = experience;

  const path = `/${slug}`;
  const title = `${SITE_NAME} ● ${role} at ${company}`;
  const description = excerpt(txt, 160);
  const image = pipe(
    Option.fromNullishOr(imageName),
    Option.filter((name) => name.length > 0),
    Option.map((name) => absoluteUrl(`/images/${name}-a.webp`)),
    Option.getOrElse(() => GLOBAL_IMAGE)
  );

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "author", content: SITE_NAME },
      ...socialMeta({ title, description, path, image, ogType: "article" }),
    ],
    links: [canonicalLink(path), ...hreflangLinks(path)],
    scripts: [experienceJsonLd(slug, experience)],
  } as const satisfies DocumentHead;
};

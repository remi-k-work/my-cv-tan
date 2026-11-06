// HTML page head builders: the shared page head layout, the experience detail head, and the three
// static page heads (home, education, contact). Each concrete head supplies its own social card,
// Markdown twin path, and JSON-LD graph to the shared `pageHead` layout.

// services, features, and other libraries
import { Option } from "effect";
import { INDEXABLE_ROBOTS } from "@/domain/http";
import { matchPreferredLanguage } from "@/domain/helpers";
import { canonicalLink, markdownAlternateLink } from "./link-tags";
import { experienceSeo } from "./experience-seo";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./page-graphs";
import { jsonLdGraph } from "./merge";
import { siteNodes } from "./entities";
import { globalSocialImage, socialMeta } from "./social-meta";
import { staticPageCopy } from "./pages";

// types
import type { ExperienceHeadInput, JsonLdNodes, PageHead, SocialImage, SocialImageFacts, StaticPageCopy, StaticPageHeadInput } from "./models";
import type { SocialMetaInput } from "./social-meta";
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";

// constants
import { BRANDED_TITLE, CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "./constants";

// Shared page head layout merging title, indexing directives, social cards, links and graph.
// `social` carries the Open Graph / Twitter fields rendered by `socialMeta`; the remaining
// fields are page-structural. Composition keeps the social contract explicit instead of
// inheriting it into the page spec.
//
// Only the page's own canonical and Markdown alternate are declared here: the site-wide
// discovery and identity links (llms, sitemap, author, rel=me) live on the root head and are
// merged into every page's head by the router, so restating them here would only duplicate them.
interface PageHeadSpec {
  readonly social: SocialMetaInput;
  readonly markdownPath: string;
  readonly graph: JsonLdNodes;
}

export const pageHead = ({ social, markdownPath, graph }: PageHeadSpec): PageHead => ({
  meta: [
    { title: BRANDED_TITLE(social.title) },
    { name: "description", content: social.description },
    { name: "robots", content: INDEXABLE_ROBOTS },
    ...socialMeta(social),
  ],
  links: [canonicalLink(social.canonical), markdownAlternateLink(markdownPath, social.preferredLanguage)],
  scripts: [jsonLdGraph([...siteNodes, ...graph])],
});

// The detail page's card image: its own verified screenshot with a localized alt, or the global
// banner when the page publishes no image. Both cards then describe the picture they actually show.
const experienceCardImage = (headline: string, image: Option.Option<SocialImageFacts>, preferredLanguage: PreferredLanguage): SocialImage =>
  Option.match(image, {
    onNone: () => globalSocialImage(preferredLanguage),
    onSome: (screenshot) => ({
      ...screenshot,
      alt: matchPreferredLanguage(preferredLanguage, `Screenshot of ${headline}`, `Zrzut ekranu przedstawiający ${headline}`),
    }),
  });

export const experienceHead = (input: ExperienceHeadInput): PageHead => {
  const seo = experienceSeo(input);

  return pageHead({
    social: {
      title: seo.headline,
      description: seo.description,
      canonical: seo.canonical,
      image: experienceCardImage(seo.headline, seo.screenshot, seo.preferredLanguage),
      preferredLanguage: seo.preferredLanguage,
      ogType: "article",
      articleSection: seo.experience.type === "e" ? "employment" : "portfolio",
    },
    markdownPath: seo.markdownPath,
    graph: experienceJsonLd(seo),
  });
};

// Shared layout for the three static pages; only the page graph differs.
const staticPageHead = (copy: StaticPageCopy, graph: JsonLdNodes): PageHead =>
  pageHead({
    social: {
      title: copy.seoTitle,
      description: copy.description,
      canonical: copy.canonical,
      image: globalSocialImage(copy.preferredLanguage),
      preferredLanguage: copy.preferredLanguage,
    },
    markdownPath: copy.mdHref,
    graph,
  });

export const homeHead = (input: StaticPageHeadInput & { readonly experienceList: ExperienceList }): PageHead => {
  const copy = staticPageCopy(input.pageTitles, HOME_PATH, input.preferredLanguage);
  return staticPageHead(copy, homeJsonLd({ ...copy, experienceList: input.experienceList }));
};

export const educationHead = (input: StaticPageHeadInput & { readonly educationList: EducationList }): PageHead => {
  const copy = staticPageCopy(input.pageTitles, EDUCATION_PATH, input.preferredLanguage);
  return staticPageHead(copy, educationJsonLd({ ...copy, educationList: input.educationList }));
};

export const contactHead = (input: StaticPageHeadInput): PageHead => {
  const copy = staticPageCopy(input.pageTitles, CONTACT_PATH, input.preferredLanguage);
  return staticPageHead(copy, contactJsonLd(copy));
};

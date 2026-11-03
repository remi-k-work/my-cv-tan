// Page head builders emitting meta tags, canonical/alternate links, and JSON-LD structured data.

// services, features, and other libraries
import { Option } from "effect";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { jsonLdGraph } from "./json-ld/core";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./json-ld/pages";
import { siteNodes } from "./json-ld/site";
import { headLanguage } from "./language";
import { authorLink, canonicalLink, llmsDiscoveryLink, markdownAlternateLink } from "./links";
import { socialMeta } from "./social";
import { staticPageCopy } from "./static-pages";
import { absoluteUrl, experienceMarkdownPath, experiencePath, experienceScreenshot } from "./url";

// types
import type { PagePath, PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { SocialImage, SocialMetaInput } from "./social";
import type { JsonLdNodes } from "./json-ld/core";
import type { StaticPageCopy } from "./static-pages";
import type { MatchChain } from "./language";
import type { ExperienceHeadInput, PageHead, StaticPageHeadInput } from "./models";

interface PageHeadSpec extends SocialMetaInput {
  readonly markdownPath: string;
  readonly graph: JsonLdNodes;
  readonly authorLink?: string;
}

// constants
import { AUTHOR_URL, BRANDED_TITLE, GLOBAL_SOCIAL_IMAGE, INDEXABLE_ROBOTS, META_DESCRIPTION_LENGTH, NOINDEX_FOLLOW, SITE_DESCRIPTION } from "./constants";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "./static-pages";

const EMPTY_HEAD: PageHead = { meta: [], links: [], scripts: [] };

// Shared page head layout merging branded title, indexing directives, social cards, links and graph.
const pageHead = ({ markdownPath, graph, authorLink: authorLinkValue, ...social }: PageHeadSpec): PageHead => {
  const meta = [
    { title: BRANDED_TITLE(social.title) },
    { name: "description", content: social.description },
    { name: "robots", content: INDEXABLE_ROBOTS },
    ...socialMeta(social),
  ];

  const links = [
    canonicalLink(social.canonical),
    markdownAlternateLink(markdownPath, social.preferredLanguage),
    ...(authorLinkValue ? [authorLink(authorLinkValue)] : []),
    llmsDiscoveryLink(),
  ];

  return { meta, links, scripts: [jsonLdGraph([...siteNodes, ...graph])] };
};

// Fallback head when loader data is missing: maintains canonical and noindex while preserving site entities.
const fallbackHead = (pagePath: string): PageHead => ({
  meta: [
    { name: "robots", content: NOINDEX_FOLLOW },
    { name: "description", content: SITE_DESCRIPTION },
  ],
  links: [canonicalLink(absoluteUrl(pagePath))],
  scripts: [jsonLdGraph(siteNodes)],
});

// Route head wrapper resolving language from match chain and handling absent loader data.
export const routeHead = <TData>(
  loaderData: TData,
  matches: MatchChain,
  build: (loaderData: NonNullable<TData>, preferredLanguage: PreferredLanguage) => PageHead,
  options: { readonly fallbackPath?: string } = {}
): PageHead => {
  if (loaderData == null) {
    return options.fallbackPath !== undefined ? fallbackHead(options.fallbackPath) : EMPTY_HEAD;
  }
  return build(loaderData, headLanguage(matches));
};

// Shared head builder for static pages aligning copy, canonical links, and structured data.
const staticPageHead = (input: StaticPageHeadInput, pagePath: PagePath, graph: (copy: StaticPageCopy) => JsonLdNodes): PageHead => {
  const copy = staticPageCopy(input.pageTitles, pagePath, input.preferredLanguage);
  return pageHead({
    title: copy.seoTitle,
    description: copy.description,
    canonical: copy.canonical,
    markdownPath: copy.mdHref,
    image: GLOBAL_SOCIAL_IMAGE,
    preferredLanguage: copy.preferredLanguage,
    graph: graph(copy),
  });
};

export const homeHead = (input: StaticPageHeadInput & { readonly experienceList: ExperienceList }): PageHead =>
  staticPageHead(input, HOME_PATH, (copy) => homeJsonLd({ ...copy, experienceList: input.experienceList }));

export const educationHead = (input: StaticPageHeadInput & { readonly educationList: EducationList }): PageHead =>
  staticPageHead(input, EDUCATION_PATH, (copy) => educationJsonLd({ ...copy, educationList: input.educationList }));

export const contactHead = (input: StaticPageHeadInput): PageHead => staticPageHead(input, CONTACT_PATH, (copy) => contactJsonLd(copy));

// Detail page head for an experience or portfolio project.
export const experienceHead = ({ experience, preferredLanguage }: ExperienceHeadInput): PageHead => {
  const { slug, txt, imageName, type } = experience;
  const employment = type === "e";
  const headline = experienceHeadline(experience, preferredLanguage);

  return pageHead({
    title: headline,
    description: excerpt(txt, META_DESCRIPTION_LENGTH),
    canonical: absoluteUrl(experiencePath(slug)),
    markdownPath: experienceMarkdownPath(slug),
    image: experienceCardImage(headline, imageName),
    ogType: "article",
    articleSection: employment ? "employment" : "portfolio",
    authorLink: AUTHOR_URL,
    preferredLanguage,
    graph: experienceJsonLd({ experience, preferredLanguage }),
  });
};

// Screenshot image when available, otherwise the global social banner.
const experienceCardImage = (headline: string, imageName: string): SocialImage =>
  Option.match(experienceScreenshot(imageName), {
    onNone: () => GLOBAL_SOCIAL_IMAGE,
    onSome: (screenshot) => ({ ...screenshot, alt: `Screenshot of ${headline}` }),
  });

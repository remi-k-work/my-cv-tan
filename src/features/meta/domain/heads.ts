// Page head builders emitting meta tags, canonical/alternate links, and JSON-LD structured data.
import { Option } from "effect";
import { experienceHeadline, excerpt } from "@/features/experience/domain/helpers";
import { authorLink, canonicalLink, llmsDiscoveryLink, markdownAlternateLink } from "./links";
import { absoluteUrl, experienceMarkdownPath, experiencePath, experienceScreenshot } from "./url";
import { socialMeta, type SocialImage, type SocialMetaInput } from "./social";
import { jsonLdGraph, type JsonLdNodes } from "./json-ld/core";
import { siteNodes } from "./json-ld/site";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./json-ld/pages";
import { staticPageCopy, CONTACT_PATH, EDUCATION_PATH, HOME_PATH, type StaticPageCopy } from "./static-pages";
import { headLanguage, type MatchChain } from "./language";
import { emptyHead, type ExperienceHeadInput, type PageHead, type StaticPageHeadInput } from "./models";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PagePath, PreferredLanguage } from "@/domain/models";

// constants
import { AUTHOR_URL, BRANDED_TITLE, GLOBAL_SOCIAL_IMAGE, INDEXABLE_ROBOTS, META_DESCRIPTION_LENGTH, NOINDEX_FOLLOW, SITE_DESCRIPTION } from "./constants";

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
  const preferredLanguage = headLanguage(matches);

  return Option.match(Option.fromNullishOr(loaderData), {
    onNone: () => (options.fallbackPath !== undefined ? fallbackHead(options.fallbackPath) : emptyHead),
    onSome: (data) => build(data, preferredLanguage),
  });
};

// Shared head builder for static pages aligning copy, canonical links, and structured data.
const staticPageHead = (
  input: StaticPageHeadInput,
  pagePath: PagePath,
  graph: (copy: StaticPageCopy) => JsonLdNodes
): PageHead => {
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

export const contactHead = (input: StaticPageHeadInput): PageHead =>
  staticPageHead(input, CONTACT_PATH, (copy) => contactJsonLd(copy));

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

interface PageHeadSpec extends SocialMetaInput {
  readonly markdownPath: string;
  readonly graph: JsonLdNodes;
  readonly authorLink?: string;
}

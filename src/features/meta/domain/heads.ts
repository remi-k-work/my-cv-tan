// HTML head configuration and builders for root and leaf routes.

// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { PreferredLanguage } from "@/domain/models";
import { jsonLdGraph } from "./json-ld/core";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd } from "./json-ld/pages";
import { siteNodes } from "./json-ld/site";
import { authorLink, canonicalLink, llmsDiscoveryLink, markdownAlternateLink, sitemapLink } from "./links";
import { socialMeta } from "./social";
import { staticPageCopy } from "./static-pages";
import { absoluteUrl, experienceMarkdownPath, experiencePath, experienceScreenshot } from "./url";

// types
import type { PagePath } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { SocialImage, SocialMetaInput } from "./social";
import type { JsonLdNodes } from "./json-ld/core";
import type { StaticPageCopy } from "./static-pages";
import type { ExperienceHeadInput, LinkTag, MetaTag, PageHead, StaticPageHeadInput } from "./models";

interface PageHeadSpec extends SocialMetaInput {
  readonly markdownPath: string;
  readonly graph: JsonLdNodes;
  readonly authorLink?: string;
}

// constants
import {
  AUTHOR_URL,
  AVATAR,
  BRANDED_TITLE,
  DEFAULT_LANGUAGE,
  GLOBAL_SOCIAL_IMAGE,
  HOME_TITLE,
  INDEXABLE_ROBOTS,
  META_DESCRIPTION_LENGTH,
  NOINDEX_FOLLOW,
  SITE_DESCRIPTION,
  SITE_NAME,
  SOCIAL_LINKS,
} from "./constants";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "./static-pages";
import { AI_INDEX_LINKS } from "./links";

// TanStack's route head chain provides the root loader data first.
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown }>;

const decodeRootLoaderData = Schema.decodeUnknownOption(Schema.Struct({ preferredLanguage: PreferredLanguage }));

export const headLanguage = (matches: MatchChain): PreferredLanguage =>
  pipe(
    Array.head(matches),
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage),
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

interface RootHeadContract {
  readonly meta: ReadonlyArray<MetaTag>;
  readonly links: ReadonlyArray<LinkTag>;
  readonly scripts?: undefined;
}

const ME_LINKS = SOCIAL_LINKS.map((href) => ({ rel: "me", href }));

// The root owns fallbacks and discovery links; leaf routes add their canonical and JSON-LD.
export const ROOT_HEAD = {
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#1d2549" },
    { title: BRANDED_TITLE(HOME_TITLE) },
    { name: "description", content: SITE_DESCRIPTION },
    { name: "author", content: SITE_NAME },
    { name: "robots", content: NOINDEX_FOLLOW },
  ],
  links: [
    { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", href: AVATAR.src },
    authorLink(AUTHOR_URL),
    llmsDiscoveryLink(),
    sitemapLink(),
    ...ME_LINKS,
    ...AI_INDEX_LINKS,
  ],
} satisfies RootHeadContract;

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

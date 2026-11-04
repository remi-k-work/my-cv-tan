// HTML head configuration and builders for root and leaf routes.

// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { excerpt, experienceHeadline } from "@/features/experience/domain/helpers";
import { PreferredLanguage } from "@/domain/models";
import { authorLink, canonicalLink, markdownAlternateLink } from "./links";
import { contactJsonLd, educationJsonLd, experienceJsonLd, homeJsonLd, jsonLdGraph, siteNodes } from "./structured-data";
import { staticPageCopy } from "./static-pages";
import { absoluteUrl, experienceMarkdownPath, experiencePath, experienceScreenshot } from "./url";

// types
import type { PagePath } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceHeadInput, LinkTag, MetaTag, PageHead, SocialImage, StaticPageHeadInput } from "./models";
import type { JsonLdNodes } from "./structured-data";
import type { StaticPageCopy } from "./static-pages";

interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: "employment" | "portfolio";
}

// TanStack's route head chain provides the root loader data first.
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown }>;

interface RootHeadContract {
  readonly meta: ReadonlyArray<MetaTag>;
  readonly links: ReadonlyArray<LinkTag>;
  readonly scripts?: undefined;
}

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
  OPEN_GRAPH_LOCALES,
  PUBLISHER_URL,
  SITE_DESCRIPTION,
  SITE_LANGUAGES,
  SITE_NAME,
  SOCIAL_LINKS,
} from "./constants";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "./static-pages";
import { AI_INDEX_LINKS, LLMS_DISCOVERY_LINK, SITEMAP_LINK } from "./links";

const EMPTY_HEAD: PageHead = { meta: [], links: [], scripts: [] };
const ME_LINKS: ReadonlyArray<LinkTag> = SOCIAL_LINKS.map((href) => ({ rel: "me", href }));

// --- Social cards ---

// Supported alternate locales for og:locale:alternate tags.
const alternateLocales = (preferredLanguage: PreferredLanguage) => SITE_LANGUAGES.filter((language) => language !== preferredLanguage);

const socialMeta = ({
  title,
  description,
  canonical,
  image,
  preferredLanguage,
  ogType = "website",
  articleSection,
}: SocialMetaInput): ReadonlyArray<MetaTag> => [
  { property: "og:title", content: title },
  { property: "og:description", content: description },
  { property: "og:image", content: image.src },
  { property: "og:image:url", content: image.src },
  { property: "og:image:alt", content: image.alt },
  { property: "og:image:type", content: image.mime },
  { property: "og:image:width", content: `${image.width}` },
  { property: "og:image:height", content: `${image.height}` },
  { property: "og:image:secure_url", content: image.src },
  { property: "og:type", content: ogType },
  { property: "og:url", content: canonical },
  { property: "og:site_name", content: SITE_NAME },
  { property: "og:locale", content: OPEN_GRAPH_LOCALES[preferredLanguage] },
  ...alternateLocales(preferredLanguage).map((language) => ({ property: "og:locale:alternate", content: OPEN_GRAPH_LOCALES[language] })),
  ...(ogType === "article"
    ? [
        { property: "article:author", content: AUTHOR_URL },
        { property: "article:publisher", content: PUBLISHER_URL },
      ]
    : []),
  ...(ogType === "article" && articleSection ? [{ property: "article:section", content: articleSection }] : []),
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: title },
  { name: "twitter:description", content: description },
  { name: "twitter:image", content: GLOBAL_SOCIAL_IMAGE.src },
  { name: "twitter:image:alt", content: GLOBAL_SOCIAL_IMAGE.alt },
];

// --- Route heads ---

const decodeRootLoaderData = Schema.decodeUnknownOption(Schema.Struct({ preferredLanguage: PreferredLanguage }));

export const headLanguage = (matches: MatchChain): PreferredLanguage =>
  pipe(
    Array.head(matches),
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage),
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

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
    LLMS_DISCOVERY_LINK,
    SITEMAP_LINK,
    ...ME_LINKS,
    ...AI_INDEX_LINKS,
  ],
} satisfies RootHeadContract;

// Shared page head layout merging title, indexing directives, social cards, links and graph.
const pageHead = ({ markdownPath, graph, authorLink: authorHref, ...social }: PageHeadSpec): PageHead => ({
  meta: [
    { title: BRANDED_TITLE(social.title) },
    { name: "description", content: social.description },
    { name: "robots", content: INDEXABLE_ROBOTS },
    ...socialMeta(social),
  ],
  links: [
    canonicalLink(social.canonical),
    markdownAlternateLink(markdownPath, social.preferredLanguage),
    ...(authorHref ? [authorLink(authorHref)] : []),
    LLMS_DISCOVERY_LINK,
  ],
  scripts: [jsonLdGraph([...siteNodes, ...graph])],
});

// Fallback head when loader data is missing: keeps canonical and noindex while preserving site entities.
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

// --- Page head builders ---

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

export const contactHead = (input: StaticPageHeadInput): PageHead => staticPageHead(input, CONTACT_PATH, contactJsonLd);

// Screenshot image when available, otherwise the global social banner.
const experienceCardImage = (headline: string, imageName: string): SocialImage =>
  Option.match(experienceScreenshot(imageName), {
    onNone: () => GLOBAL_SOCIAL_IMAGE,
    onSome: (screenshot) => ({ ...screenshot, alt: `Screenshot of ${headline}` }),
  });

// Detail page head for an experience or portfolio project.
export const experienceHead = ({ experience, preferredLanguage }: ExperienceHeadInput): PageHead => {
  const { slug, txt, imageName, type } = experience;
  const headline = experienceHeadline(experience, preferredLanguage);

  return pageHead({
    title: headline,
    description: excerpt(txt, META_DESCRIPTION_LENGTH),
    canonical: absoluteUrl(experiencePath(slug)),
    markdownPath: experienceMarkdownPath(slug),
    image: experienceCardImage(headline, imageName),
    ogType: "article",
    articleSection: type === "e" ? "employment" : "portfolio",
    authorLink: AUTHOR_URL,
    preferredLanguage,
    graph: experienceJsonLd({ experience, preferredLanguage }),
  });
};

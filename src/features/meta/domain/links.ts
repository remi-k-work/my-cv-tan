// URL addressing and RFC 8288 link tags shared by HTML heads, Markdown twins,
// discovery documents and HTTP responses.

// services, features, and other libraries
import { flow, Option, Schema, String, pipe } from "effect";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";

// types
import { PreferredLanguage } from "@/domain/models";
import type { LinkTag, SocialImageFacts } from "./models";

// constants
import {
  CV_EN_HREF,
  CV_PL_HREF,
  DEFAULT_LANGUAGE,
  LLMS_FULL_TXT_HREF,
  LLMS_TXT_HREF,
  SITE_LANGUAGES,
  SITEMAP_HREF,
  SITE_URL,
} from "./constants";

// --- URL helpers ---

// Validates and parses URLs safely into an Option.
export const decodeUrlOption = Schema.decodeUnknownOption(Schema.URLFromString);

const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

// Canonical absolute URL for a site path.
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// Appends or updates the lang query parameter on a URL.
export const withLanguageParam = (url: string, preferredLanguage: PreferredLanguage) =>
  pipe(
    decodeUrlOption(url),
    Option.map((variant) => {
      variant.searchParams.set("lang", preferredLanguage);
      return variant.href;
    }),
    Option.getOrElse(() => url)
  );

// Canonical absolute URL for a localized markdown twin endpoint.
export const markdownTwinUrl = (mdPath: string, preferredLanguage: PreferredLanguage) =>
  withLanguageParam(absoluteUrl(mdPath), preferredLanguage);

// Resolves CV download link based on visitor language.
export const cvPdfHref = (preferredLanguage: PreferredLanguage) =>
  preferredLanguage === "pl" ? CV_PL_HREF : CV_EN_HREF;

// encodeURIComponent leaves parentheses untouched, but they terminate a Markdown link
// destination, so they are percent-encoded wherever a path may be embedded in Markdown.
export const encodeParens = (value: string) => value.replace(/\(/g, "%28").replace(/\)/g, "%29");

// Resolves experience route and markdown twin path from slug.
export const experiencePath = (slug: string) => `/${encodeParens(encodeURIComponent(slug))}`;
export const experienceMarkdownPath = (slug: string) => `${experiencePath(slug)}.md`;

// Resolves screenshot dimensions and absolute URL when an image name is provided.
export const experienceScreenshot = (imageName: string): Option.Option<SocialImageFacts> => {
  const name = String.trim(imageName);

  return String.isNonEmpty(name)
    ? Option.some({
        src: absoluteUrl(`/images/${encodeURIComponent(name)}-a.webp`),
        mime: "image/webp",
        width: SCREENSHOT_WIDTH,
        height: SCREENSHOT_HEIGHT,
      })
    : Option.none();
};

// --- URL parsing ---

// Extracts the ?lang= override from a request URL, validating it against supported languages.
export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.flatMap(({ searchParams }) => Option.fromNullishOr(searchParams.get("lang"))),
    Option.map(flow(String.trim, String.toLowerCase)),
    Option.flatMap(decodePreferredLanguage)
  );

// Extracts a markdown twin slug from a request URL pathname (e.g. /my-page.md -> "my-page").
// The twin route is one path segment, so literal nested paths and extensionless paths return
// None; an encoded slash inside the segment still decodes into the slug.
export const slugFromMdPathname = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) => pathname.slice(1)),
    Option.filter((path) => !path.includes("/")),
    Option.filter((segment) => segment.endsWith(".md")),
    Option.map((segment) => segment.slice(0, -".md".length)),
    Option.flatMap(decodeUrlComponent),
    Option.filter(String.isNonEmpty)
  );

// --- RFC 8288 Link formatting ---

// Formats a single link as an RFC 8288 header value in fixed parameter order (rel, type, title, hreflang).
const linkHeader = ({ href, rel, type, title, hreflang }: LinkTag) => {
  const parts = [`rel="${rel}"`];
  if (type !== undefined) parts.push(`type="${type}"`);
  if (title !== undefined) parts.push(`title="${title}"`);
  if (hreflang !== undefined) parts.push(`hreflang="${hreflang}"`);
  return `<${href}>; ${parts.join("; ")}`;
};

export const joinLinkHeader = (links: ReadonlyArray<LinkTag>) => links.map(linkHeader).join(", ");

export const canonicalLink = (href: string): LinkTag => ({ rel: "canonical", href });
export const authorLink = (href: string): LinkTag => ({ rel: "author", href });

// All markdown alternate links share the same rel and type.
const markdownLink = (href: string, hreflang?: string): LinkTag => ({
  rel: "alternate",
  type: "text/markdown",
  ...(hreflang !== undefined ? { hreflang } : {}),
  href,
});

export const markdownAlternateLink = (mdPath: string, preferredLanguage: PreferredLanguage): LinkTag =>
  markdownLink(markdownTwinUrl(mdPath, preferredLanguage));

// Hreflang alternates for every supported language plus x-default.
export const languageVariantLinks = (markdownUrl: string): ReadonlyArray<LinkTag> => [
  ...SITE_LANGUAGES.map((language) => markdownLink(withLanguageParam(markdownUrl, language), language)),
  markdownLink(withLanguageParam(markdownUrl, DEFAULT_LANGUAGE), "x-default"),
];

// --- Discovery link declarations ---

// The AI index documents, declared once and projected into both the <head> and the Link header.
export const LLMS_TXT_INDEX = { name: "llms.txt", url: absoluteUrl(LLMS_TXT_HREF) } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", url: absoluteUrl(LLMS_FULL_TXT_HREF) } as const;
export const AI_INDEXES = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;

export const SITEMAP_LINK: LinkTag = { rel: "sitemap", href: absoluteUrl(SITEMAP_HREF) };
export const LLMS_DISCOVERY_LINK: LinkTag = { rel: "llms", href: LLMS_TXT_INDEX.url };

export const AI_INDEX_LINKS: ReadonlyArray<LinkTag> = AI_INDEXES.map(({ name, url }) => ({
  rel: "alternate",
  type: "text/plain",
  title: name,
  href: url,
}));

export const AI_INDEX_LINK_HEADER = joinLinkHeader(AI_INDEX_LINKS);

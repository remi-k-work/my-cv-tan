// URL formatting, Link-header serialization, and asset resolution for metadata.

// services, features, and other libraries
import { Option, Schema, String, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LinkTag, SocialImageFacts } from "./models";

// constants
import {
  CV_EN_HREF,
  CV_PL_HREF,
  DEFAULT_LANGUAGE,
  LLMS_FULL_TXT_HREF,
  LLMS_TXT_HREF,
  SITE_LANGUAGES,
  SITE_URL,
  SITEMAP_HREF,
} from "./constants";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";

// --- URL Helpers ---

// Validates and parses URLs safely into an Option.
export const decodeUrlOption = Schema.decodeUnknownOption(Schema.URLFromString);

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
  matchPreferredLanguage(preferredLanguage, CV_EN_HREF, CV_PL_HREF);

// Encodes parentheses to keep markdown links well-formed.
export const encodeParens = (value: string) => value.replace(/[()]/g, (char) => encodeURIComponent(char));

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

// --- RFC 8288 Link Formatting & Declarations ---

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

export const markdownAlternateLink = (mdPath: string, preferredLanguage: PreferredLanguage): LinkTag => ({
  rel: "alternate",
  type: "text/markdown",
  href: markdownTwinUrl(mdPath, preferredLanguage),
});

export const SITEMAP_LINK: LinkTag = { rel: "sitemap", href: absoluteUrl(SITEMAP_HREF) };
export const LLMS_DISCOVERY_LINK: LinkTag = { rel: "llms", href: absoluteUrl(LLMS_TXT_HREF) };

// Discovery document declarations for GEO index surfaces.
export const LLMS_TXT_INDEX = { name: "llms.txt", url: LLMS_DISCOVERY_LINK.href } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", url: absoluteUrl(LLMS_FULL_TXT_HREF) } as const;
export const AI_INDEXES = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;

export const AI_INDEX_LINKS: ReadonlyArray<LinkTag> = AI_INDEXES.map(({ name, url }) => ({
  rel: "alternate",
  type: "text/plain",
  title: name,
  href: url,
}));

export const AI_INDEX_LINK_HEADER = joinLinkHeader(AI_INDEX_LINKS);

// Hreflang alternates for every supported language plus x-default.
export const languageVariantLinks = (markdownUrl: string): ReadonlyArray<LinkTag> => [
  ...SITE_LANGUAGES.map((language): LinkTag => ({
    rel: "alternate",
    type: "text/markdown",
    hreflang: language,
    href: withLanguageParam(markdownUrl, language),
  })),
  { rel: "alternate", type: "text/markdown", hreflang: "x-default", href: withLanguageParam(markdownUrl, DEFAULT_LANGUAGE) },
];

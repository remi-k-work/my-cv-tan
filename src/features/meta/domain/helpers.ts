// URL formatting, Link serialization, and asset resolution for metadata.

// services, features, and other libraries
import { Option, Schema, String, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LinkTag, SocialImageFacts } from "./models";

// constants
import { CV_EN_HREF, CV_PL_HREF, DEFAULT_LANGUAGE, SITE_LANGUAGES, SITE_URL } from "./constants";
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

// --- RFC 8288 Link Formatting ---

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

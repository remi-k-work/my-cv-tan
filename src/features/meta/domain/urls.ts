// URL addressing shared by HTML heads, Markdown twins, discovery documents and HTTP responses.
// Pure string computation: no network, no layer, no framework types.

// services, features, and other libraries
import { Option, Schema, String, pipe } from "effect";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { SocialImageFacts } from "./models";

// constants
import { CV_EN_HREF, CV_PL_HREF, SITE_URL } from "./constants";

// --- URL helpers ---

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
export const markdownTwinUrl = (mdPath: string, preferredLanguage: PreferredLanguage) => withLanguageParam(absoluteUrl(mdPath), preferredLanguage);

// Resolves CV download link based on visitor language.
export const cvPdfHref = (preferredLanguage: PreferredLanguage) => (preferredLanguage === "pl" ? CV_PL_HREF : CV_EN_HREF);

// `encodeURIComponent` already percent-encodes parentheses, but `encodeParens` is applied on top
// anywhere a path is embedded in Markdown (or XML) so a `)` can never terminate a link destination
// and a `(` can never open an unbalanced one, regardless of how the URL was produced.
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

// URL addressing shared by HTML heads, Markdown twins, discovery documents and HTTP responses.
// Pure string computation: no network, no layer, no framework types.

// services, features, and other libraries
import { Option, Schema, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { CV_EN_HREF, CV_PL_HREF, SITE_URL } from "./constants";

// --- URL helpers ---

// Validates and parses URLs safely into an Option.
export const decodeUrlOption = Schema.decodeUnknownOption(Schema.URLFromString);

// Content fields accept any non-empty string, but only http(s) URLs may be published as links.
// The HTML head, the JSON-LD graphs and the Markdown twins all filter through this one rule.
export const httpUrlOption = (value: string): Option.Option<string> =>
  pipe(
    decodeUrlOption(value),
    Option.filter((url) => url.protocol === "http:" || url.protocol === "https:"),
    Option.map((url) => url.href)
  );

// The form every publisher of an authored link reads it in: an absent value and a value the site
// refuses to publish are both `None`, so one guard serves the optional fields the schemas allow.
export const validatedHref = (value: string | undefined): Option.Option<string> => pipe(Option.fromNullishOr(value), Option.flatMap(httpUrlOption));

// Canonical absolute URL for a site path.
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// The one language-override query parameter every published twin URL carries (markdownTwinUrl) and
// every twin request reads back (markdown/domain/requests). Named beside the builder that writes it so
// the pin and its parser can never disagree about the parameter and silently drop a `?lang=` override.
export const LANG_PARAM = "lang";

// Appends or updates the lang query parameter on a URL.
export const withLanguageParam = (url: string, preferredLanguage: PreferredLanguage) =>
  pipe(
    decodeUrlOption(url),
    Option.map((variant) => {
      variant.searchParams.set(LANG_PARAM, preferredLanguage);
      return variant.href;
    }),
    Option.getOrElse(() => url)
  );

// Canonical absolute URL for a localized markdown twin endpoint.
export const markdownTwinUrl = (mdPath: string, preferredLanguage: PreferredLanguage) => withLanguageParam(absoluteUrl(mdPath), preferredLanguage);

// Resolves the visitor's own CV file; both languages are advertised site-wide, but the header
// nav offers the one that matches the reader.
export const cvPdfHref = (preferredLanguage: PreferredLanguage) => matchPreferredLanguage(preferredLanguage, CV_EN_HREF, CV_PL_HREF);

// `encodeURIComponent` leaves parentheses unescaped, so apply `encodeParens` wherever a path is
// embedded in Markdown or XML to keep them from changing the destination's structure.
export const encodeParens = (value: string) => value.replace(/\(/g, "%28").replace(/\)/g, "%29");

// Resolves experience route and markdown twin path from slug.
export const experiencePath = (slug: string) => `/${encodeParens(encodeURIComponent(slug))}`;
export const experienceMarkdownPath = (slug: string) => `${experiencePath(slug)}.md`;

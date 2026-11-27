// Canonical URL math shared by every surface: validating authored links, resolving site paths,
// pinning the language parameter, and encoding experience routes

// services, features, and other libraries
import { Option, Schema, String, pipe } from "effect";

// types
import type { PreferredLanguage } from "./models";

// constants
import { SITE_URL } from "./site";

// Query parameter used for explicit language override in markdown twins
export const LANG_PARAM = "lang";

// `decodeOption` rather than `decodeUnknownOption`: every caller hands this a URL string, so the
// narrower input type makes a non-string a compile error instead of a runtime None
export const decodeUrlOption = Schema.decodeOption(Schema.URLFromString);

const HttpUrl = Schema.URLFromString.check(Schema.makeFilter((url) => url.protocol === "http:" || url.protocol === "https:"));
const decodeHttpUrlOption = Schema.decodeOption(HttpUrl);

// Validates that a string is a valid HTTP(S) URL
export const httpUrlOption = (value: string) =>
  pipe(
    decodeHttpUrlOption(value),
    Option.map((url) => url.href)
  );

// Filters optional authored links so only valid HTTP(S) links are published
export const validatedHref = (value: string | undefined) => pipe(Option.fromNullishOr(value), Option.flatMap(httpUrlOption));

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// Appends or updates the ?lang= parameter on a URL
export const withLanguageParam = (url: string, preferredLanguage: PreferredLanguage) =>
  pipe(
    decodeUrlOption(url),
    Option.map((parsed) => {
      // Each call decodes a fresh URL, so this mutation cannot leak into another variant
      parsed.searchParams.set(LANG_PARAM, preferredLanguage);
      return parsed.href;
    }),
    Option.getOrElse(() => url)
  );

export const markdownTwinUrl = (mdPath: string, preferredLanguage: PreferredLanguage) => withLanguageParam(absoluteUrl(mdPath), preferredLanguage);

// Percent-encodes parentheses which encodeURIComponent leaves raw
export const encodeParens = (value: string) => pipe(value, String.replaceAll("(", "%28"), String.replaceAll(")", "%29"));

// Percent-encodes parentheses and whitespace for Markdown link destinations
export const encodeDestination = (value: string) => pipe(encodeParens(value), String.replaceAll(/\s/g, "%20"));

// Path encoding and its inverse live together so a change to one cannot silently break the other
const decodeSegment = Option.liftThrowable(decodeURIComponent);

// Rejects a decoded empty segment as well as a malformed escape, so a bare ".md" route cannot name an experience
export const decodeExperienceSlug = (segment: string): Option.Option<string> => pipe(segment, decodeSegment, Option.filter(String.isNonEmpty));

export const experiencePath = (slug: string) => `/${encodeParens(encodeURIComponent(slug))}`;
export const experienceMarkdownPath = (slug: string) => `${experiencePath(slug)}.md`;

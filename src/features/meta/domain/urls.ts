// services, features, and other libraries
import { Option, Schema, pipe } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { LANG_PARAM, SITE_URL } from "./constants";

export const decodeUrlOption = Schema.decodeUnknownOption(Schema.URLFromString);

// Validates that a string is a valid HTTP(S) URL
export const httpUrlOption = (value: string) =>
  pipe(
    decodeUrlOption(value),
    Option.filter((url) => url.protocol === "http:" || url.protocol === "https:"),
    Option.map((url) => url.href)
  );

// Filters optional authored links so only valid HTTP(S) links are published
export const validatedHref = (value: string | undefined) => pipe(Option.fromNullishOr(value), Option.flatMap(httpUrlOption));

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// Appends or updates the ?lang= parameter on a URL
export const withLanguageParam = (url: string, preferredLanguage: PreferredLanguage) =>
  pipe(
    decodeUrlOption(url),
    Option.map((variant) => {
      variant.searchParams.set(LANG_PARAM, preferredLanguage);
      return variant.href;
    }),
    Option.getOrElse(() => url)
  );

export const markdownTwinUrl = (mdPath: string, preferredLanguage: PreferredLanguage) => withLanguageParam(absoluteUrl(mdPath), preferredLanguage);

// Percent-encodes parentheses which encodeURIComponent leaves raw
export const encodeParens = (value: string) => value.replace(/\(/g, "%28").replace(/\)/g, "%29");

// Percent-encodes parentheses and whitespace for Markdown link destinations
export const encodeDestination = (value: string) => encodeParens(value).replace(/\s/g, "%20");

export const experiencePath = (slug: string) => `/${encodeParens(encodeURIComponent(slug))}`;
export const experienceMarkdownPath = (slug: string) => `${experiencePath(slug)}.md`;

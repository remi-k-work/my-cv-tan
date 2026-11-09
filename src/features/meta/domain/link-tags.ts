// services, features, and other libraries
import { Array, Option } from "effect";
import { markdownTwinUrl, withLanguageParam } from "./urls";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LinkTag } from "./models";

// constants
import { DEFAULT_LANGUAGE, SITE_LANGUAGES } from "@/domain/constants";

const linkParam = (key: string, value: string | undefined) => Option.fromNullishOr(value).pipe(Option.map((v) => `${key}="${v}"`));

// Serializes a link tag in RFC 8288 parameter order: rel, type, title, hreflang.
const linkHeader = ({ href, rel, type, title, hreflang }: LinkTag) => {
  const parts = Array.getSomes([Option.some(`rel="${rel}"`), linkParam("type", type), linkParam("title", title), linkParam("hreflang", hreflang)]);
  return `<${href}>; ${parts.join("; ")}`;
};

export const joinLinkHeader = (links: ReadonlyArray<LinkTag>) => links.map(linkHeader).join(", ");
export const canonicalLink = (href: string): LinkTag => ({ rel: "canonical", href });
export const authorLink = (href: string): LinkTag => ({ rel: "author", href });

const markdownLink = (href: string, hreflang?: string): LinkTag => ({
  rel: "alternate",
  type: "text/markdown",
  ...(hreflang !== undefined ? { hreflang } : {}),
  href,
});

export const markdownAlternateLink = (mdPath: string, preferredLanguage: PreferredLanguage): LinkTag =>
  markdownLink(markdownTwinUrl(mdPath, preferredLanguage));

export const languageVariantLinks = (markdownUrl: string): ReadonlyArray<LinkTag> => [
  ...SITE_LANGUAGES.map((language) => markdownLink(withLanguageParam(markdownUrl, language), language)),
  markdownLink(withLanguageParam(markdownUrl, DEFAULT_LANGUAGE), "x-default"),
];

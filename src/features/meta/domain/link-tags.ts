// services, features, and other libraries
import { Array, Option, String } from "effect";
import { absoluteUrl, withLanguageParam } from "./urls";

// types
import type { LinkTag } from "./models";

// constants
import { DEFAULT_LANGUAGE, SITE_LANGUAGES } from "@/domain/constants";

const quoteParam = String.replaceAll(/["\\]/g, "\\$&");
const linkParam = (key: string, value: string | undefined) =>
  Option.fromUndefinedOr(value).pipe(Option.map((parameter) => `${key}="${quoteParam(parameter)}"`));

// Serializes a link tag in RFC 8288 parameter order: rel, type, title, hreflang.
const linkHeader = ({ href, rel, type, title, hrefLang }: LinkTag) => {
  // `rel` is the one required parameter, so it is written directly instead of being lifted into an
  // Option only to be taken straight back out of `getSomes`
  const parameters = [`rel="${rel}"`, ...Array.getSomes([linkParam("type", type), linkParam("title", title), linkParam("hreflang", hrefLang)])];
  return `<${href}>; ${Array.join(parameters, "; ")}`;
};

export const joinLinkHeader = (links: ReadonlyArray<LinkTag>) => Array.join(Array.map(links, linkHeader), ", ");
export const canonicalLink = (href: string): LinkTag => ({ rel: "canonical", href });
export const authorLink = (href: string): LinkTag => ({ rel: "author", href });

const markdownLink = (href: string, hrefLang: string): LinkTag => ({
  rel: "alternate",
  type: "text/markdown",
  hrefLang,
  href,
});

// Accepts the canonical, unpinned site path so callers cannot accidentally build variants of a variant
export const languageVariantLinks = (markdownPath: string): ReadonlyArray<LinkTag> => {
  const markdownUrl = absoluteUrl(markdownPath);

  return [
    ...Array.map(SITE_LANGUAGES, (language) => markdownLink(withLanguageParam(markdownUrl, language), language)),
    markdownLink(withLanguageParam(markdownUrl, DEFAULT_LANGUAGE), "x-default"),
  ];
};

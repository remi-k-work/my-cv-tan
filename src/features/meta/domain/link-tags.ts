// services, features, and other libraries
import { Array, Option, String, pipe } from "effect";
import { absoluteUrl, withLanguageParam } from "@/domain/urls";

// types
import type { LinkTag } from "./models";

// constants
import { SITE_LANGUAGES } from "@/domain/constants";

const quoteParam = String.replaceAll(/["\\]/g, "\\$&");
const linkParam = (key: string, value: string | undefined) =>
  Option.fromUndefinedOr(value).pipe(Option.map((parameter) => `${key}="${quoteParam(parameter)}"`));

// Serializes a link tag in RFC 8288 parameter order: rel, type, title, hreflang.
const linkHeader = ({ href, rel, type, title, hrefLang }: LinkTag) =>
  pipe(
    [Option.some(`rel="${quoteParam(rel)}"`), linkParam("type", type), linkParam("title", title), linkParam("hreflang", hrefLang)],
    Array.getSomes,
    Array.prepend(`<${href}>`),
    Array.join("; ")
  );

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
    // The unpinned twin negotiates unmatched languages and falls back to the source language
    markdownLink(markdownUrl, "x-default"),
  ];
};

// One declaration feeds HTML link elements and Markdown Link headers, including any extra discovery links
export const representationLinks = (canonical: string, markdownPath: string, discovery: ReadonlyArray<LinkTag> = []): ReadonlyArray<LinkTag> => [
  canonicalLink(canonical),
  ...discovery,
  ...languageVariantLinks(markdownPath),
];

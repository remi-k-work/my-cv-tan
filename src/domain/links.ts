// The `<link>` vocabulary every surface publishes: the LinkTag shape, RFC 8288 serialization,
// the canonical/author/alternate builders, and the discovery projections (sitemap, llms indexes,
// rel=me) built from ./discovery

// services, features, and other libraries
import { Array, Option, String, pipe } from "effect";
import { absoluteUrl, withLanguageParam } from "./urls";

// constants
import { SITE_LANGUAGES } from "./constants";
import { SOCIAL_LINKS } from "./site";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX, SITEMAP_INDEX } from "./discovery";

export interface LinkTag {
  readonly rel: string;
  readonly href: string;
  readonly type?: string;
  readonly title?: string;
  // TanStack forwards link descriptors to React, which names this property hrefLang
  readonly hrefLang?: string;
}

const quoteParam = String.replaceAll(/["\\]/g, "\\$&");
const linkParam = (key: string, value: string | undefined) =>
  Option.fromUndefinedOr(value).pipe(Option.map((parameter) => `${key}="${quoteParam(parameter)}"`));

// Serializes a link tag in RFC 8288 parameter order: rel, type, title, hreflang
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

export const SITEMAP_LINK = { rel: "sitemap", href: SITEMAP_INDEX.url } as const;

// llms.txt reserves `describedby` for its index and `alternate` for a page's own Markdown twin
export const LLMS_DISCOVERY_LINK: LinkTag = { rel: "describedby", href: LLMS_TXT_INDEX.url };
export const LLMS_FULL_DISCOVERY_LINK: LinkTag = { rel: "related", type: "text/plain", title: LLMS_FULL_TXT_INDEX.name, href: LLMS_FULL_TXT_INDEX.url };
export const AI_DISCOVERY_LINKS: ReadonlyArray<LinkTag> = [LLMS_DISCOVERY_LINK, LLMS_FULL_DISCOVERY_LINK];

// Discovery documents name other crawl surfaces, never a redundant reference to themselves
export const aiDiscoveryLinkHeader = (selfUrl?: string) => joinLinkHeader(Array.filter(AI_DISCOVERY_LINKS, ({ href }) => href !== selfUrl));
export const AI_DISCOVERY_LINK_HEADER = aiDiscoveryLinkHeader();

export const ME_LINKS: ReadonlyArray<LinkTag> = Array.map(SOCIAL_LINKS, (href) => ({ rel: "me", href }));

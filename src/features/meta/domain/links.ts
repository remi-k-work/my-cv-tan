// <link> tags and RFC 8288 Link-header projections for HTML heads and HTTP responses.

// services, features, and other libraries
import { absoluteUrl, markdownTwinUrl, withLanguageParam } from "./url";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LinkTag } from "./models";

// RFC 8288 link parameters published by the site.
interface LinkParameters {
  readonly type?: string;
  readonly title?: string;
  readonly hreflang?: string;
}

interface LinkValue extends LinkParameters {
  readonly href: string;
  readonly rel: string;
}

// constants
import { DEFAULT_LANGUAGE, LLMS_FULL_TXT_HREF, LLMS_TXT_HREF, SITE_LANGUAGES, SITEMAP_HREF } from "./constants";

// Formats a single link as an RFC 8288 header value in fixed parameter order (rel, type, title, hreflang).
const linkHeader = ({ href, rel, type, title, hreflang }: LinkValue) => {
  const parts = [`rel="${rel}"`];
  if (type !== undefined) parts.push(`type="${type}"`);
  if (title !== undefined) parts.push(`title="${title}"`);
  if (hreflang !== undefined) parts.push(`hreflang="${hreflang}"`);
  return `<${href}>; ${parts.join("; ")}`;
};

export const joinLinkHeader = (links: ReadonlyArray<LinkValue>) => links.map(linkHeader).join(", ");
export const canonicalLink = (href: string): LinkTag => ({ rel: "canonical", href });

export const markdownAlternateLink = (mdPath: string, preferredLanguage: PreferredLanguage): LinkTag => ({
  rel: "alternate",
  type: "text/markdown",
  href: markdownTwinUrl(mdPath, preferredLanguage),
});

export const sitemapLink = (): LinkTag => ({ rel: "sitemap", href: absoluteUrl(SITEMAP_HREF) });
export const authorLink = (href: string): LinkTag => ({ rel: "author", href });
export const llmsDiscoveryLink = (): LinkTag => ({ rel: "llms", href: absoluteUrl(LLMS_TXT_HREF) });

// Discovery document declarations for GEO index surfaces.
export const LLMS_TXT_INDEX = { name: "llms.txt", url: absoluteUrl(LLMS_TXT_HREF) } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", url: absoluteUrl(LLMS_FULL_TXT_HREF) } as const;
export const AI_INDEXES = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;
export const AI_INDEX_LINKS: ReadonlyArray<LinkValue> = AI_INDEXES.map(({ name, url }) => ({
  rel: "alternate",
  type: "text/plain",
  title: name,
  href: url,
}));

export const llmsAlternateLinks: ReadonlyArray<LinkTag> = AI_INDEX_LINKS.map(({ href, rel, type, title }) => ({ rel, href, type, title }));
export const AI_INDEX_LINK_HEADER = joinLinkHeader(AI_INDEX_LINKS);

// Hreflang alternates for every supported language plus x-default.
export const languageVariantLinks = (markdownUrl: string): ReadonlyArray<LinkValue> => [
  ...SITE_LANGUAGES.map((language): LinkValue => ({
    rel: "alternate",
    type: "text/markdown",
    hreflang: language,
    href: withLanguageParam(markdownUrl, language),
  })),
  { rel: "alternate", type: "text/markdown", hreflang: "x-default", href: withLanguageParam(markdownUrl, DEFAULT_LANGUAGE) },
];

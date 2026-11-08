// RFC 8288 link tags and the AI-index / sitemap discovery declarations shared by HTML heads,
// Markdown twins, discovery documents and HTTP responses.
// Built on the URL primitives in ./urls; every link is declared once and projected onto both
// the <head> and the Link header so the two surfaces can never disagree.

// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { absoluteUrl, markdownTwinUrl, withLanguageParam } from "./urls";

// types
import type { LinkTag } from "./models";
import type { PreferredLanguage } from "@/domain/models";

// constants
import { LLMS_FULL_TXT_HREF, LLMS_TXT_HREF, SITEMAP_HREF } from "./discovery";
import { DEFAULT_LANGUAGE } from "./languages";
import { SITE_LANGUAGES } from "@/domain/constants";

// --- RFC 8288 Link formatting ---

// Formats a single link parameter if defined.
const linkParam = (key: string, value: string | undefined): Option.Option<string> =>
  pipe(
    Option.fromNullishOr(value),
    Option.map((v) => `${key}="${v}"`)
  );

// Formats a single link as an RFC 8288 header value in fixed parameter order (rel, type, title, hreflang).
const linkHeader = ({ href, rel, type, title, hreflang }: LinkTag): string => {
  const parts = Array.getSomes([Option.some(`rel="${rel}"`), linkParam("type", type), linkParam("title", title), linkParam("hreflang", hreflang)]);
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

// --- Discovery link declarations ---

// The AI index documents, declared once and projected into both the <head> and the Link header.
export const LLMS_TXT_INDEX = { name: "llms.txt", url: absoluteUrl(LLMS_TXT_HREF) } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", url: absoluteUrl(LLMS_FULL_TXT_HREF) } as const;
export const AI_INDEXES = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;

export const SITEMAP_LINK = { rel: "sitemap", href: absoluteUrl(SITEMAP_HREF) };
export const LLMS_DISCOVERY_LINK: LinkTag = { rel: "llms", href: LLMS_TXT_INDEX.url };

export const AI_INDEX_LINKS: ReadonlyArray<LinkTag> = AI_INDEXES.map(({ name, url }) => ({ rel: "alternate", type: "text/plain", title: name, href: url }));
export const AI_INDEX_LINK_HEADER = joinLinkHeader(AI_INDEX_LINKS);

// HTTP responses for localized Markdown twins.

// services, features, and other libraries
import { Option } from "effect";
import { markdownTwinUrl } from "@/features/meta/domain/url";
import { canonicalLink, joinLinkHeader, languageVariantLinks } from "@/features/meta/domain/links";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { AI_INDEX_LINKS } from "@/features/meta/domain/links";
import { INDEXABLE_ROBOTS, LANGUAGE_VARY } from "@/features/meta/domain/constants";
import { CACHEABLE_HEADERS, MACHINE_HEADERS, UNAVAILABLE_HEADERS } from "@/features/meta/domain/response";
import { MD_CONTENT_TYPE } from "./constants";

const headersFor = (preferredLanguage: PreferredLanguage) => ({
  ...MACHINE_HEADERS,
  "Content-Type": MD_CONTENT_TYPE,
  ...CACHEABLE_HEADERS,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
  "X-Robots-Tag": INDEXABLE_ROBOTS,
});

const unavailableHeadersFor = (preferredLanguage: PreferredLanguage) => ({ ...headersFor(preferredLanguage), ...UNAVAILABLE_HEADERS });

const markdownLinks = (canonical: string, markdownUrl: string) =>
  joinLinkHeader([canonicalLink(canonical), ...AI_INDEX_LINKS, ...languageVariantLinks(markdownUrl)]);

export const mdResponse = (input: {
  readonly body: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly canonical: string;
  readonly markdownPath: string;
}) => {
  const markdownUrl = markdownTwinUrl(input.markdownPath, input.preferredLanguage);

  return new Response(input.body, {
    status: 200,
    headers: { ...headersFor(input.preferredLanguage), "Content-Location": markdownUrl, Link: markdownLinks(input.canonical, markdownUrl) },
  });
};

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) => {
  const location = Option.isSome(markdownPath) ? { "Content-Location": markdownTwinUrl(markdownPath.value, preferredLanguage) } : undefined;

  return new Response(body, { status: 404, headers: { ...unavailableHeadersFor(preferredLanguage), ...location } });
};

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 503, headers: unavailableHeadersFor(preferredLanguage) });

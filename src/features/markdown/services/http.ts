// HTTP envelopes for the Markdown twin documents: the language-negotiated document headers,
// the twin Link header, and the 404/503 fallback shapes the twin pipelines recover into.

// services, features, and other libraries
import { Option } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";

// meta (shared)
import { AI_INDEX_LINKS, canonicalLink, joinLinkHeader, languageVariantLinks } from "@/features/meta/domain/link-tags";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import { CACHEABLE_HEADERS, documentHeaders, INDEXABLE_HEADERS, UNAVAILABLE_HEADERS } from "@/features/meta/services";

const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";

// A twin is a language-negotiated document: everything `documentHeaders` carries, plus its media type.
const markdownHeaders = (preferredLanguage: PreferredLanguage) => ({
  ...documentHeaders(preferredLanguage),
  "Content-Type": MD_CONTENT_TYPE,
});

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
    headers: {
      ...markdownHeaders(input.preferredLanguage),
      ...CACHEABLE_HEADERS,
      ...INDEXABLE_HEADERS,
      "Content-Location": markdownUrl,
      Link: markdownLinks(input.canonical, markdownUrl),
    },
  });
};

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) => {
  const location = Option.isSome(markdownPath) ? { "Content-Location": markdownTwinUrl(markdownPath.value, preferredLanguage) } : undefined;

  return new Response(body, { status: 404, headers: { ...markdownHeaders(preferredLanguage), ...UNAVAILABLE_HEADERS, ...location } });
};

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 503, headers: { ...markdownHeaders(preferredLanguage), ...UNAVAILABLE_HEADERS } });

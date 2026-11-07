// HTTP envelopes for the Markdown twin documents: the language-negotiated document headers,
// the twin Link header, and the 404/503 fallback shapes the twin pipelines recover into.

// services, features, and other libraries
import { Option } from "effect";

// types
import type { PreferredLanguage } from "@/domain/models";

// meta (shared)
import { AI_INDEX_LINK_HEADER, AI_INDEX_LINKS, canonicalLink, joinLinkHeader, languageVariantLinks } from "@/features/meta/domain/link-tags";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import { CACHEABLE_HEADERS, documentHeaders, INDEXABLE_HEADERS, SERVICE_UNAVAILABLE_HEADERS, UNAVAILABLE_HEADERS } from "@/features/meta/services/headers";
import { withoutNegotiationVary } from "../domain/cache-variant";

const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";

// An explicit language pin makes the URL the complete cache key. Keep unrelated Vary tokens,
// such as compression, while removing only the inputs the pin replaces.
export const pinCacheVariant = (response: Response) => {
  const headers = new Headers(response.headers);
  const vary = withoutNegotiationVary(headers.get("vary"));

  if (vary !== null) headers.set("vary", vary);
  else headers.delete("vary");

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// A twin is a language-negotiated document: everything `documentHeaders` carries, plus its media
// type. The Link header is passed in rather than composed here, so each envelope names the one
// link set it publishes instead of inheriting `documentHeaders`' AI-index list and then replacing
// it silently — a failure envelope would keep advertisements a success envelope had widened, and
// dropping the AI indexes from the wider set would go unnoticed.
const markdownHeaders = (preferredLanguage: PreferredLanguage, links: string) => ({
  ...documentHeaders(preferredLanguage),
  "Content-Type": MD_CONTENT_TYPE,
  Link: links,
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
      ...markdownHeaders(input.preferredLanguage, markdownLinks(input.canonical, markdownUrl)),
      ...CACHEABLE_HEADERS,
      ...INDEXABLE_HEADERS,
      "Content-Location": markdownUrl,
    },
  });
};

// Both failure envelopes share one contract: the AI indexes stay advertised, nothing caches and
// nothing indexes. A 404 alone names the representation that was asked for — there is no location to
// name for a path the route could not even parse — and, being permanent, never advertises retry
// timing; only a 503 tells the fetcher when to come back.
const mdFailureResponse = (body: string, preferredLanguage: PreferredLanguage, status: 404 | 503, contentLocation?: string) =>
  new Response(body, {
    status,
    headers: {
      ...markdownHeaders(preferredLanguage, AI_INDEX_LINK_HEADER),
      ...(status === 503 ? SERVICE_UNAVAILABLE_HEADERS : UNAVAILABLE_HEADERS),
      ...(contentLocation === undefined ? {} : { "Content-Location": contentLocation }),
    },
  });

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) =>
  mdFailureResponse(body, preferredLanguage, 404, Option.isSome(markdownPath) ? markdownTwinUrl(markdownPath.value, preferredLanguage) : undefined);

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) => mdFailureResponse(body, preferredLanguage, 503);

// services, features, and other libraries
import { Array, HashSet, Match, Option, Predicate, Record, String, pipe } from "effect";
import { documentHeaders, locationHeader, responseEnvelope } from "@/lib/http-response";
import { markdownTwinUrl } from "@/domain/urls";
import { canonicalAndDiscoveryLinks, joinLinkHeader } from "@/domain/links";

// types
import type { PreferredLanguage } from "@/domain/models";

interface HeaderUpdates {
  readonly set?: Readonly<Record<string, string>>;
  readonly remove?: ReadonlyArray<string>;
}

// constants
import { AI_DISCOVERY_LINK_HEADER, AI_DISCOVERY_LINKS } from "@/domain/links";
import { CACHEABLE_HEADERS, INDEXABLE_HEADERS, NEGOTIATION_VARY_TOKENS, SERVICE_UNAVAILABLE_HEADERS, UNAVAILABLE_HEADERS } from "@/lib/http-response";

const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";
const NEGOTIATION_VARY = pipe(NEGOTIATION_VARY_TOKENS, Array.map(String.toLowerCase), HashSet.fromIterable);

const isNonNegotiationToken = Predicate.and(String.isNonEmpty, (token: string) => !HashSet.has(NEGOTIATION_VARY, String.toLowerCase(token)));

// Strips language negotiation tokens from a Vary header, returning None when nothing remains
export const withoutNegotiationVary = (vary: string | null) =>
  pipe(
    Option.fromNullishOr(vary),
    Option.map((value) => pipe(String.split(value, ","), Array.map(String.trim), Array.filter(isNonNegotiationToken), Array.join(", "))),
    // A Vary left with only negotiation tokens is no Vary at all, so the caller drops the header
    Option.filter(String.isNonEmpty)
  );

const withHeaders = (response: Response, { set = {}, remove = [] }: HeaderUpdates) => {
  const headers = new Headers(response.headers);
  Array.forEach(remove, (name) => headers.delete(name));
  Array.forEach(Record.toEntries(set), ([name, value]) => headers.set(name, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// Drops language negotiation Vary tokens when the URL contains an explicit ?lang= pin
export const pinCacheVariant = (response: Response) =>
  withHeaders(
    response,
    Option.match(withoutNegotiationVary(response.headers.get("vary")), {
      // Nothing worth negotiating on: the pinned URL already names its language, so drop Vary entirely
      onNone: () => ({ remove: ["vary"] }),
      onSome: (vary) => ({ set: { vary } }),
    })
  );

// Temporary source-language fallbacks must neither enter shared caches nor compete with the requested page in search indexes
export const temporaryFallbackResponse = (response: Response) =>
  withHeaders(response, {
    set: {
      "Cache-Control": UNAVAILABLE_HEADERS["Cache-Control"],
      "X-Robots-Tag": UNAVAILABLE_HEADERS["X-Robots-Tag"],
    },
  });

// Enforces cache and Vary policy based on whether the response is a fallback or language-pinned
export const applyRepresentationPolicy = (response: Response, fallback: boolean, langOverride: Option.Option<PreferredLanguage>) =>
  Match.value({ fallback, cacheable: response.ok, pinned: Option.isSome(langOverride) }).pipe(
    // A fallback is temporary negotiated content, so it must bypass both caching and language pinning
    Match.when({ fallback: true }, () => temporaryFallbackResponse(response)),
    // Only cacheable, explicitly pinned responses strip language-negotiation Vary tokens
    Match.when({ cacheable: true, pinned: true }, () => pinCacheVariant(response)),
    Match.orElse(() => response)
  );

const markdownHeaders = (preferredLanguage: PreferredLanguage, links: string) => ({
  ...documentHeaders(preferredLanguage),
  "Content-Type": MD_CONTENT_TYPE,
  Link: links,
});

const markdownLinks = (canonical: string) => joinLinkHeader(canonicalAndDiscoveryLinks(canonical, AI_DISCOVERY_LINKS));

export const mdResponse = (input: {
  readonly body: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly canonical: string;
  readonly markdownPath: string;
}) => {
  const markdownUrl = markdownTwinUrl(input.markdownPath, input.preferredLanguage);

  return responseEnvelope(200, input.body, {
    ...markdownHeaders(input.preferredLanguage, markdownLinks(input.canonical)),
    ...CACHEABLE_HEADERS,
    ...INDEXABLE_HEADERS,
    "Content-Location": markdownUrl,
  });
};

const failureStatusHeaders = (status: 404 | 503) =>
  Match.value(status).pipe(
    Match.when(503, () => SERVICE_UNAVAILABLE_HEADERS),
    Match.when(404, () => UNAVAILABLE_HEADERS),
    Match.exhaustive
  );

const mdFailureResponse = (body: string, preferredLanguage: PreferredLanguage, status: 404 | 503, contentLocation?: string) =>
  responseEnvelope(status, body, {
    ...markdownHeaders(preferredLanguage, AI_DISCOVERY_LINK_HEADER),
    ...failureStatusHeaders(status),
    ...locationHeader(contentLocation),
  });

const markdownLocation = (markdownPath: Option.Option<string>, preferredLanguage: PreferredLanguage) =>
  pipe(
    markdownPath,
    Option.map((path) => markdownTwinUrl(path, preferredLanguage)),
    Option.getOrUndefined
  );

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) =>
  mdFailureResponse(body, preferredLanguage, 404, markdownLocation(markdownPath, preferredLanguage));

// A retryable error still identifies the language-pinned representation the crawler requested
export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) =>
  mdFailureResponse(body, preferredLanguage, 503, markdownLocation(markdownPath, preferredLanguage));

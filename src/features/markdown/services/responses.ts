// services, features, and other libraries
import { Array, HashSet, Option, String, pipe } from "effect";
import { documentHeaders } from "@/features/meta/services/responses";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import { canonicalLink, joinLinkHeader, languageVariantLinks } from "@/features/meta/domain/link-tags";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { NO_STORE } from "@/domain/http";
import { AI_DISCOVERY_LINK_HEADER, AI_DISCOVERY_LINKS } from "@/features/meta/domain/discovery";
import {
  CACHEABLE_HEADERS,
  INDEXABLE_HEADERS,
  NEGOTIATION_VARY_TOKENS,
  SERVICE_UNAVAILABLE_HEADERS,
  UNAVAILABLE_HEADERS,
} from "@/features/meta/services/responses";

const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";
const NEGOTIATION_VARY = pipe(NEGOTIATION_VARY_TOKENS, Array.map(String.toLowerCase), HashSet.fromIterable);

// Strips language negotiation tokens from a Vary header, returning None when nothing remains
export const withoutNegotiationVary = (vary: string | null) =>
  pipe(
    Option.fromNullishOr(vary),
    Option.map((value) =>
      pipe(
        String.split(value, ","),
        Array.map(String.trim),
        Array.filter((token) => String.isNonEmpty(token) && !HashSet.has(NEGOTIATION_VARY, String.toLowerCase(token))),
        Array.join(", ")
      )
    ),
    // A Vary left with only negotiation tokens is no Vary at all, so the caller drops the header
    Option.filter(String.isNonEmpty)
  );

const withHeaders = (response: Response, update: (headers: Headers) => void) => {
  const headers = new Headers(response.headers);
  update(headers);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// Drops language negotiation Vary tokens when the URL contains an explicit ?lang= pin
export const pinCacheVariant = (response: Response) =>
  withHeaders(response, (headers) => {
    const vary = withoutNegotiationVary(headers.get("vary"));

    Option.match(vary, {
      // Nothing worth negotiating on: the pinned URL already names its language, so drop Vary entirely
      onNone: () => headers.delete("vary"),
      onSome: (value) => headers.set("vary", value),
    });
  });

// A translation fallback is a temporary English representation: never let a shared cache pin it
export const withoutCaching = (response: Response) => withHeaders(response, (headers) => headers.set("Cache-Control", NO_STORE));

const markdownHeaders = (preferredLanguage: PreferredLanguage, links: string) => ({
  ...documentHeaders(preferredLanguage),
  "Content-Type": MD_CONTENT_TYPE,
  Link: links,
});

const markdownLinks = (canonical: string, markdownPath: string) =>
  joinLinkHeader([canonicalLink(canonical), ...AI_DISCOVERY_LINKS, ...languageVariantLinks(markdownPath)]);

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
      ...markdownHeaders(input.preferredLanguage, markdownLinks(input.canonical, input.markdownPath)),
      ...CACHEABLE_HEADERS,
      ...INDEXABLE_HEADERS,
      "Content-Location": markdownUrl,
    },
  });
};

const mdFailureResponse = (body: string, preferredLanguage: PreferredLanguage, status: 404 | 503, contentLocation?: string) =>
  new Response(body, {
    status,
    headers: {
      ...markdownHeaders(preferredLanguage, AI_DISCOVERY_LINK_HEADER),
      ...(status === 503 ? SERVICE_UNAVAILABLE_HEADERS : UNAVAILABLE_HEADERS),
      ...(contentLocation === undefined ? {} : { "Content-Location": contentLocation }),
    },
  });

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) =>
  mdFailureResponse(
    body,
    preferredLanguage,
    404,
    pipe(
      markdownPath,
      Option.map((path) => markdownTwinUrl(path, preferredLanguage)),
      Option.getOrUndefined
    )
  );

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) => mdFailureResponse(body, preferredLanguage, 503);

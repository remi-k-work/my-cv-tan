// services, features, and other libraries
import { Array, Option, String, pipe } from "effect";
import { documentHeaders } from "@/features/meta/domain/helpers";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import { canonicalLink, joinLinkHeader, languageVariantLinks } from "@/features/meta/domain/link-tags";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { NO_STORE } from "@/domain/http";
import {
  AI_INDEX_LINK_HEADER,
  AI_INDEX_LINKS,
  CACHEABLE_HEADERS,
  INDEXABLE_HEADERS,
  NEGOTIATION_VARY_TOKENS,
  SERVICE_UNAVAILABLE_HEADERS,
  UNAVAILABLE_HEADERS,
} from "@/features/meta/domain/constants";

const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";
const NEGOTIATION_VARY = new Set(NEGOTIATION_VARY_TOKENS.map((token) => token.toLowerCase()));

// Strips language negotiation tokens from a Vary header, returning null if nothing remains
export const withoutNegotiationVary = (vary: string | null) =>
  pipe(
    Option.fromNullishOr(vary),
    Option.map((value) =>
      pipe(
        String.split(value, ","),
        Array.map(String.trim),
        Array.filter((token) => String.isNonEmpty(token) && !NEGOTIATION_VARY.has(token.toLowerCase()))
      )
    ),
    Option.filter((tokens) => tokens.length > 0),
    Option.map(Array.join(", ")),
    Option.getOrNull
  );

const withHeaders = (response: Response, update: (headers: Headers) => void) => {
  const headers = new Headers(response.headers);
  update(headers);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

// Drops language negotiation Vary tokens when the URL contains an explicit ?lang= pin
export const pinCacheVariant = (response: Response) =>
  withHeaders(response, (headers) => {
    const varyOption = Option.fromNullishOr(withoutNegotiationVary(headers.get("vary")));

    Option.match(varyOption, {
      onNone: () => headers.delete("vary"),
      onSome: (vary) => headers.set("vary", vary),
    });
  });

// A translation fallback is a temporary English representation: never let a shared cache pin it
export const withoutCaching = (response: Response) => withHeaders(response, (headers) => headers.set("Cache-Control", NO_STORE));

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

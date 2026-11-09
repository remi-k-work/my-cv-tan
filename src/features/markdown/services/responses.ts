// services, features, and other libraries
import { Option } from "effect";
import { documentHeaders } from "@/features/meta/domain/helpers";
import { markdownTwinUrl } from "@/features/meta/domain/urls";
import { canonicalLink, joinLinkHeader, languageVariantLinks } from "@/features/meta/domain/link-tags";
import { withoutNegotiationVary } from "@/features/markdown/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import {
  AI_INDEX_LINK_HEADER,
  AI_INDEX_LINKS,
  CACHEABLE_HEADERS,
  INDEXABLE_HEADERS,
  SERVICE_UNAVAILABLE_HEADERS,
  UNAVAILABLE_HEADERS,
} from "@/features/meta/domain/constants";

const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";

// Drops language negotiation Vary tokens when URL contains an explicit ?lang= pin
export const pinCacheVariant = (response: Response) => {
  const headers = new Headers(response.headers);
  const varyOption = Option.fromNullishOr(withoutNegotiationVary(headers.get("vary")));

  Option.match(varyOption, {
    onNone: () => headers.delete("vary"),
    onSome: (vary) => headers.set("vary", vary),
  });

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

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

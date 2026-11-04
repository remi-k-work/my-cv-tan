// URL parsing and HTTP responses for Markdown document routes.

// services, features, and other libraries
import { flow, Option, Schema, String, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import {
  AI_INDEX_LINKS,
  canonicalLink,
  decodeUrlOption,
  joinLinkHeader,
  languageVariantLinks,
  markdownTwinUrl,
} from "@/features/meta/domain/helpers";

// constants
import { INDEXABLE_ROBOTS, LANGUAGE_VARY } from "@/features/meta/domain/constants";
import { CACHEABLE_HEADERS, MACHINE_HEADERS, UNAVAILABLE_HEADERS } from "@/features/meta/http";

const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";

const decodePreferredLanguage = Schema.decodeUnknownOption(PreferredLanguage);
const decodeUrlComponent = Option.liftThrowable(decodeURIComponent);

export const parseLangParam = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.flatMap(({ searchParams }) => Option.fromNullishOr(searchParams.get("lang"))),
    Option.map(flow(String.trim, String.toLowerCase)),
    Option.flatMap(decodePreferredLanguage)
  );

export const slugFromMdPathname = (url: string) =>
  pipe(
    decodeUrlOption(url),
    Option.map(({ pathname }) => pathname.slice(pathname.lastIndexOf("/") + 1)),
    Option.filter((segment) => segment.endsWith(".md")),
    Option.map((segment) => segment.slice(0, -".md".length)),
    Option.flatMap(decodeUrlComponent),
    Option.filter(String.isNonEmpty)
  );

const headersFor = (preferredLanguage: PreferredLanguage) => ({
  ...MACHINE_HEADERS,
  "Content-Type": MD_CONTENT_TYPE,
  ...CACHEABLE_HEADERS,
  "Content-Language": preferredLanguage,
  Vary: LANGUAGE_VARY,
  "X-Robots-Tag": INDEXABLE_ROBOTS,
});

const unavailableHeadersFor = (preferredLanguage: PreferredLanguage) => ({
  ...headersFor(preferredLanguage),
  ...UNAVAILABLE_HEADERS,
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
    headers: { ...headersFor(input.preferredLanguage), "Content-Location": markdownUrl, Link: markdownLinks(input.canonical, markdownUrl) },
  });
};

export const mdNotFoundResponse = (body: string, preferredLanguage: PreferredLanguage, markdownPath: Option.Option<string>) => {
  const location = Option.isSome(markdownPath) ? { "Content-Location": markdownTwinUrl(markdownPath.value, preferredLanguage) } : undefined;

  return new Response(body, { status: 404, headers: { ...unavailableHeadersFor(preferredLanguage), ...location } });
};

export const mdUnavailableResponse = (body: string, preferredLanguage: PreferredLanguage) =>
  new Response(body, { status: 503, headers: unavailableHeadersFor(preferredLanguage) });

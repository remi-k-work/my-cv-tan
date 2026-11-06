// The root route's HTML head: charset/viewport/theme, branded title, description, author,
// noindex fallback, and the discovery links advertised on every page.
// Also resolves the negotiated language from the TanStack match chain.

// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { NOINDEX_FOLLOW } from "@/domain/http";
import { matchPreferredLanguage } from "@/domain/helpers";
import { PreferredLanguage } from "@/domain/models";

// domain
import { siteGraphScript } from "./entities";
import { AI_INDEX_LINKS, LLMS_DISCOVERY_LINK, SITEMAP_LINK, authorLink, canonicalLink } from "./link-tags";
import { absoluteUrl } from "./urls";

// constants
import { AUTHOR_URL, AVATAR, BRANDED_TITLE, DEFAULT_LANGUAGE, HOME_TITLE, SITE_DESCRIPTION, SITE_NAME, SOCIAL_LINKS } from "./constants";

// types
import type { LinkTag, MatchChain, MetaTag, PageHead } from "./models";

interface RootHeadContract {
  readonly meta: ReadonlyArray<MetaTag>;
  readonly links: ReadonlyArray<LinkTag>;
  readonly scripts?: undefined;
}

const ME_LINKS: ReadonlyArray<LinkTag> = SOCIAL_LINKS.map((href) => ({ rel: "me", href }));

const decodeRootLoaderData = Schema.decodeUnknownOption(Schema.Struct({ preferredLanguage: PreferredLanguage }));

export const headLanguage = (matches: MatchChain): PreferredLanguage =>
  pipe(
    Array.head(matches),
    Option.flatMap(({ loaderData }) => decodeRootLoaderData(loaderData)),
    Option.map(({ preferredLanguage }) => preferredLanguage),
    Option.getOrElse(() => DEFAULT_LANGUAGE)
  );

// The root owns fallbacks and discovery links; leaf routes add their canonical and JSON-LD.
export const ROOT_HEAD = {
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#1d2549" },
    { title: BRANDED_TITLE(HOME_TITLE) },
    { name: "description", content: SITE_DESCRIPTION },
    { name: "author", content: SITE_NAME },
    { name: "robots", content: NOINDEX_FOLLOW },
  ],
  links: [
    { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", href: AVATAR.src },
    authorLink(AUTHOR_URL),
    LLMS_DISCOVERY_LINK,
    SITEMAP_LINK,
    ...ME_LINKS,
    ...AI_INDEX_LINKS,
  ],
} satisfies RootHeadContract;

export const isNotFoundMatch = (match: MatchChain[number]): boolean => match.status === "notFound" || match._notFound === true;

// Fallback documents stay out of search results while identifying the failed route and language.
// A route the head has no path for is one the site does not know, which is exactly the not-found
// fallback, so the copy is decided by the same fact that decides the canonical.
export const fallbackHead = (pagePath: string | undefined, preferredLanguage: PreferredLanguage = DEFAULT_LANGUAGE): PageHead => {
  const notFound = pagePath === undefined;
  const title = matchPreferredLanguage(preferredLanguage, notFound ? "Not Found" : "Page unavailable", notFound ? "Nie znaleziono" : "Strona niedostępna");
  const description = matchPreferredLanguage(
    preferredLanguage,
    notFound ? "The requested page could not be found." : "This page is temporarily unavailable.",
    notFound ? "Nie znaleziono żądanej strony." : "Ta strona jest tymczasowo niedostępna."
  );

  return {
    meta: [{ title: BRANDED_TITLE(title) }, { name: "robots", content: NOINDEX_FOLLOW }, { name: "description", content: description }],
    links: notFound ? [] : [canonicalLink(absoluteUrl(pagePath))],
    scripts: [siteGraphScript],
  };
};

// The root boundary renders not-found pages even when a route-level head callback is skipped.
export const rootHead = (matches: MatchChain): PageHead => {
  if (!matches.some(isNotFoundMatch)) return { meta: [...ROOT_HEAD.meta], links: [...ROOT_HEAD.links], scripts: [] };

  const fallback = fallbackHead(undefined, headLanguage(matches));

  return {
    meta: [...ROOT_HEAD.meta, ...fallback.meta],
    links: [...ROOT_HEAD.links, ...fallback.links],
    scripts: fallback.scripts,
  };
};

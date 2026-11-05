// The root route's HTML head: charset/viewport/theme, branded title, description, author,
// noindex fallback, and the discovery links advertised on every page.
// Also resolves the negotiated language from the TanStack match chain.

// services, features, and other libraries
import { Array, Option, Schema, pipe } from "effect";
import { PreferredLanguage } from "@/domain/models";
import { NOINDEX_FOLLOW } from "@/domain/http";

// constants
import { AUTHOR_URL, AVATAR, BRANDED_TITLE, DEFAULT_LANGUAGE, HOME_TITLE, SITE_DESCRIPTION, SITE_NAME, SOCIAL_LINKS } from "./constants";

// link tags
import { authorLink, AI_INDEX_LINKS, LLMS_DISCOVERY_LINK, SITEMAP_LINK } from "./link-tags";

// types
import type { LinkTag, MatchChain, MetaTag } from "./models";

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

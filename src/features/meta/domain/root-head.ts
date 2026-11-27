// services, features, and other libraries
import { Array } from "effect";
import { notFoundHead } from "./fallback";
import { headLanguage, isNotFoundMatch } from "./route-head";
import { authorLink } from "./link-tags";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { MatchChain, MetaTag, PageHead } from "./models";

// constants
import { AI_DISCOVERY_LINKS, ME_LINKS, SITEMAP_LINK } from "./discovery";
import { AUTHOR_URL, AVATAR, BRANDED_TITLE, HOME_TITLE, SITE_DESCRIPTION, SITE_NAME } from "./site";
import { NOINDEX_FOLLOW } from "@/domain/http";

const SHELL_META: ReadonlyArray<MetaTag> = [
  { charSet: "utf-8" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
  { name: "theme-color", content: "#1d2549" },
  { name: "author", content: SITE_NAME },
];

// Fail closed: each indexable leaf must explicitly replace this directive
const DEFAULT_ROOT_META: ReadonlyArray<MetaTag> = [
  { title: BRANDED_TITLE(HOME_TITLE) },
  { name: "description", content: SITE_DESCRIPTION },
  { name: "robots", content: NOINDEX_FOLLOW },
];

export const ROOT_HEAD: Pick<PageHead, "meta" | "links"> = {
  meta: [...SHELL_META, ...DEFAULT_ROOT_META],
  links: [
    { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", href: AVATAR.src },
    authorLink(AUTHOR_URL),
    SITEMAP_LINK,
    ...ME_LINKS,
    ...AI_DISCOVERY_LINKS,
  ],
};

const notFoundRootHead = (preferredLanguage: PreferredLanguage): PageHead => {
  const fallback = notFoundHead(preferredLanguage);

  return {
    // The root owns 404 copy for the whole match chain: replace the default page identity instead
    // of emitting duplicate tags and relying on TanStack's merge to hide them
    meta: [...SHELL_META, ...fallback.meta],
    links: [...ROOT_HEAD.links, ...fallback.links],
    scripts: fallback.scripts,
  };
};

// Builds the root head elements, handling root-level not-found fallbacks if matched
export const rootHead = (matches: MatchChain): PageHead =>
  Array.some(matches, isNotFoundMatch) ? notFoundRootHead(headLanguage(matches)) : { meta: [...ROOT_HEAD.meta], links: [...ROOT_HEAD.links], scripts: [] };

// services, features, and other libraries
import { fallbackHead } from "./helpers";
import { headLanguage, isNotFoundMatch } from "./route-head";
import { authorLink } from "./link-tags";

// types
import type { PageHead, RootHead } from "./models";
import type { MatchChain } from "./models";

// constants
import {
  AI_INDEX_LINKS,
  AUTHOR_URL,
  AVATAR,
  BRANDED_TITLE,
  HOME_TITLE,
  LLMS_DISCOVERY_LINK,
  ME_LINKS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITEMAP_LINK,
} from "./constants";
import { NOINDEX_FOLLOW } from "@/domain/http";

export const ROOT_HEAD: RootHead = {
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
};

// Builds the root head elements, handling root-level not-found fallbacks if matched.
export const rootHead = (matches: MatchChain): PageHead => {
  if (!matches.some(isNotFoundMatch)) return { meta: [...ROOT_HEAD.meta], links: [...ROOT_HEAD.links], scripts: [] };

  const fallback = fallbackHead(undefined, headLanguage(matches));

  return {
    meta: [...ROOT_HEAD.meta, ...fallback.meta],
    links: [...ROOT_HEAD.links, ...fallback.links],
    scripts: fallback.scripts,
  };
};

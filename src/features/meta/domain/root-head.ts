// The root route's HTML head: charset/viewport/theme, branded title, description, author,
// noindex fallback, and the discovery links advertised on every page. The root owns the
// not-found fallback because TanStack renders it even when a route-level head callback is skipped.

// services, features, and other libraries
import { NOINDEX_FOLLOW } from "@/domain/http";

// domain
import { AI_INDEX_LINKS, LLMS_DISCOVERY_LINK, SITEMAP_LINK, authorLink } from "./link-tags";
import { headLanguage, isNotFoundMatch } from "./route-head";
import { fallbackHead } from "./fallback";

// constants
import { AUTHOR_URL, AVATAR, BRANDED_TITLE, HOME_TITLE, SITE_DESCRIPTION, SITE_NAME, SOCIAL_LINKS } from "./identity";

// types
import type { LinkTag, PageHead } from "./models";
import type { MatchChain } from "./route-head";

// The root's site-wide head. It carries no `scripts`: TanStack concatenates every match's scripts,
// so a root-level graph would render beside the leaf's own single block. Omitting the key is the
// compile guard for that — a `scripts` key added here is an excess property.
// The arrays are readonly so no consumer of the shared declaration can reach into it, and every
// `rootHead()` result hands back its own copies (see below), honouring the PageHead contract.
type RootHead = Omit<PageHead, "scripts">;

const ME_LINKS: ReadonlyArray<LinkTag> = SOCIAL_LINKS.map((href) => ({ rel: "me", href }));

// The root owns fallbacks and discovery links; leaf routes add their canonical and JSON-LD.
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

// The root boundary renders not-found pages even when a route-level head callback is skipped.
export const rootHead = (matches: MatchChain): PageHead => {
  // Every result is the root's own arrays: a shared head object handed to each document could be
  // reached by one caller and leak into every other page rendered from the same declaration.
  if (!matches.some(isNotFoundMatch)) return { meta: [...ROOT_HEAD.meta], links: [...ROOT_HEAD.links], scripts: [] };

  const fallback = fallbackHead(undefined, headLanguage(matches));

  return {
    meta: [...ROOT_HEAD.meta, ...fallback.meta],
    links: [...ROOT_HEAD.links, ...fallback.links],
    scripts: fallback.scripts,
  };
};

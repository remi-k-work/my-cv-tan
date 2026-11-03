// Site-wide root head configuration: fallback metadata, icons, identity links, and discovery links.

// services, features, and other libraries
import { Array } from "effect";
import { authorLink, llmsAlternateLinks, llmsDiscoveryLink, sitemapLink } from "./links";

// types
import type { LinkTag, MetaTag } from "./models";

// Root head excludes scripts; JSON-LD structured data is owned by leaf page heads.
interface RootHeadContract {
  readonly meta: ReadonlyArray<MetaTag>;
  readonly links: ReadonlyArray<LinkTag>;
  readonly scripts?: undefined;
}

// constants
import { AUTHOR_URL, AVATAR, BRANDED_TITLE, HOME_TITLE, NOINDEX_FOLLOW, SITE_DESCRIPTION, SITE_NAME, SOCIAL_LINKS } from "./constants";

const ME_LINKS = Array.map(SOCIAL_LINKS, (href) => ({ rel: "me", href }));

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
    llmsDiscoveryLink(),
    sitemapLink(),
    ...ME_LINKS,
    ...llmsAlternateLinks,
  ],
} satisfies RootHeadContract;

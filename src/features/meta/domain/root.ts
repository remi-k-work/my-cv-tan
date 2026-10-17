// services, features, and other libraries
import { llmsAlternateLink } from "./url";
import { socialMeta } from "./social";
import { websitePersonJsonLd } from "./json-ld/site";

// constants
import { AVATAR_IMAGE, GLOBAL_SOCIAL_IMAGE, HOME_TITLE, SITE_DESCRIPTION, SITE_NAME, BRANDED_TITLE, SOCIAL_LINKS } from "./constants";

// Site-wide tags only. Meta dedupes by name/property keeping the leaf value, but links dedupe
// only when identical — a root-level canonical "/" would render beside every page's own canonical
export const ROOT_HEAD = {
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#1d2549" },
    { title: BRANDED_TITLE(HOME_TITLE) },
    { name: "description", content: SITE_DESCRIPTION },

    { name: "author", content: SITE_NAME },
    // Safe default: pages with complete data opt back into indexing (see indexableMeta in heads.ts)
    { name: "robots", content: "noindex, follow" },
    { name: "google", content: "notranslate" },
    // Static en_US fallback for pages without their own head (404, errors); every page head overrides these
    ...socialMeta({ title: HOME_TITLE, description: SITE_DESCRIPTION, path: "/", image: GLOBAL_SOCIAL_IMAGE, preferredLanguage: "en" }),
  ],
  links: [
    { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    // iOS "Add to Home Screen" and high-DPI search previews use the touch icon, not the SVG favicon
    { rel: "apple-touch-icon", href: AVATAR_IMAGE },
    // Identity links: rel="me" lets profile-based verifiers (Mastodon, IndieWeb) confirm the same person
    ...SOCIAL_LINKS.map((href) => ({ rel: "me", href })),
    // The llms.txt index is site-wide and identical on every page, so it safely lives here
    llmsAlternateLink(),
  ],
  scripts: [websitePersonJsonLd()],
};

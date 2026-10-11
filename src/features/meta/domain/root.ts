// services, features, and other libraries
import { llmsAlternateLink } from "./url";
import { socialMeta } from "./social";
import { websitePersonJsonLd } from "./json-ld";

// constants
import { AVATAR_IMAGE, GLOBAL_SOCIAL_IMAGE, SITE_DESCRIPTION, SITE_NAME, TITLE, BRANDED_TITLE } from "./constants";

// Root head: every page inherits this, so it must ONLY contain site-wide tags
// Page-specific tags (canonical, hreflang, Markdown alternate) live in each route's
// head() in page.ts: TanStack dedupes meta by name/property keeping the leaf value,
// but links are only deduped when fully identical, so a root-level canonical "/" would
// render ALONGSIDE the page's own canonical on every subpage
export const ROOT_HEAD = {
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#1d2549" },
    { title: BRANDED_TITLE(TITLE) },
    { name: "description", content: SITE_DESCRIPTION },

    { name: "author", content: SITE_NAME },
    // Safe default: pages with complete data opt back into indexing in page.ts
    { name: "robots", content: "noindex, follow" },
    { name: "google", content: "notranslate" },
    // Static en_US fallback for pages without their own head (404, errors); every page head overrides these tags with the resolved locale
    ...socialMeta({ title: TITLE, description: SITE_DESCRIPTION, path: "/", image: GLOBAL_SOCIAL_IMAGE, preferredLanguage: "en" }),
  ],
  links: [
    { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    // iOS "Add to Home Screen" and high-DPI search previews use the touch icon, not the SVG favicon
    { rel: "apple-touch-icon", href: AVATAR_IMAGE },
    // Deliberately no canonical / hreflang / Markdown alternate here (see note above)
    // The llms.txt index is site-wide and identical on every page, so it safely lives here
    llmsAlternateLink(),
  ],
  scripts: [websitePersonJsonLd()],
};

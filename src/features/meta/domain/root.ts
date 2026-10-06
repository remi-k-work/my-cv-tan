// services, features, and other libraries
import { excerpt } from "@/features/experience/domain";
import { llmsAlternateLink } from "./helpers";
import { socialMeta } from "./social";
import { websitePersonJsonLd } from "./json-ld";

// constants
import { DESCRIPTION, GLOBAL_SOCIAL_IMAGE, META_DESCRIPTION_LENGTH, SITE_NAME, TITLE } from "./constants";

// Root head builder: every page inherits this, so it must ONLY contain site-wide tags.
// Page-specific tags (canonical, hreflang, Markdown alternate) live in each route's
// head() in page.ts: TanStack dedupes meta by name/property keeping the leaf value,
// but links are only deduped when fully identical, so a root-level canonical "/" would
// render ALONGSIDE the page's own canonical on every subpage.
export const buildRootHead = () => {
  const description = excerpt(DESCRIPTION, META_DESCRIPTION_LENGTH);

  return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#1d2549" },
      { title: TITLE },
      { name: "description", content: description },

      { name: "author", content: SITE_NAME },
      { name: "robots", content: "noindex, follow" },
      { name: "category", content: "technology" },
      { name: "google", content: "notranslate" },
      // Static en_US fallback for pages without their own head (404, errors);
      // every page head overrides these tags with the resolved locale
      ...socialMeta({ title: TITLE, description, path: "/", image: GLOBAL_SOCIAL_IMAGE, ogType: "website", preferredLanguage: "en" }),
    ],
    links: [
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      // Deliberately no canonical / hreflang / Markdown alternate here (see note above).
      // The llms.txt index is site-wide and identical on every page, so it safely lives here.
      llmsAlternateLink(),
    ],
    scripts: [websitePersonJsonLd()],
  };
};

export const ROOT_HEAD = buildRootHead();

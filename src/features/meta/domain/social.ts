// services, features, and other libraries
import { absoluteUrl } from "./url";

// types
import type { SocialMetaInput } from "./models";

// constants
import { GLOBAL_SOCIAL_IMAGE, OPEN_GRAPH_LOCALES, SITE_NAME } from "./constants";

// Generates OpenGraph and Twitter Card metadata for rich previews in search and social platforms
// Twitter requires JPEG/PNG (rejecting WebP on cards), so twitterImage falls back to global JPEG banner
export const socialMeta = ({ title, description, path, image, preferredLanguage, twitterImage }: SocialMetaInput) => {
  const twitter = twitterImage ?? GLOBAL_SOCIAL_IMAGE;
  // The alternate locale is the one the page is not in; deriving it by name keeps the
  // record lookup readable instead of swapping the (en, pl) arguments
  const alternateLocale = preferredLanguage === "en" ? OPEN_GRAPH_LOCALES.pl : OPEN_GRAPH_LOCALES.en;

  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image.src },
    { property: "og:image:alt", content: title },
    { property: "og:image:type", content: image.mime },
    { property: "og:image:width", content: `${image.width}` },
    { property: "og:image:height", content: `${image.height}` },
    { property: "og:type", content: "website" },
    { property: "og:url", content: absoluteUrl(path) },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: OPEN_GRAPH_LOCALES[preferredLanguage] },
    { property: "og:locale:alternate", content: alternateLocale },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: twitter.src },
    { name: "twitter:image:alt", content: title },
  ] as const;
};

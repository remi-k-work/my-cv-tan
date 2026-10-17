// services, features, and other libraries
import { matchPreferredLanguage } from "@/domain/helpers";
import { absoluteUrl } from "./url";

// types
import type { SocialMetaInput } from "./models";

// constants
import { GLOBAL_SOCIAL_IMAGE, SITE_NAME } from "./constants";

// Shared Open Graph + Twitter Card tags for a page.
// og:type is always "website": no page here is an article, and og:locale mirrors
// the served language variant so scrapers render the right card.
// X/Twitter cards only reliably accept jpeg/png, so twitterImage defaults to the jpeg fallback.
export const socialMeta = ({ title, description, path, image, preferredLanguage, twitterImage }: SocialMetaInput) => {
  const twitter = twitterImage ?? GLOBAL_SOCIAL_IMAGE;
  const locale = matchPreferredLanguage(preferredLanguage, "en_US", "pl_PL");
  const localeAlternate = matchPreferredLanguage(preferredLanguage, "pl_PL", "en_US");

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
    { property: "og:locale", content: locale },
    { property: "og:locale:alternate", content: localeAlternate },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: twitter.src },
    { name: "twitter:image:alt", content: title },
  ] as const;
};

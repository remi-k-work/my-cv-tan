// services, features, and other libraries
import { Array } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { MetaTag, SocialImage, SocialMetaInput } from "./models";

// constants
import { AUTHOR_URL, GLOBAL_SOCIAL_IMAGE, OPEN_GRAPH_LOCALES, PUBLISHER_URL, SITE_NAME } from "./site";
import { SITE_LANGUAGES } from "@/domain/constants";

export const globalSocialImage = (preferredLanguage: PreferredLanguage): SocialImage => ({
  ...GLOBAL_SOCIAL_IMAGE,
  alt: matchPreferredLanguage(
    preferredLanguage,
    "Portfolio collage showing web development skills and project screenshots",
    "Kolaż portfolio przedstawiający umiejętności tworzenia stron i zrzuty projektów"
  ),
});

const alternateLocales = (preferredLanguage: PreferredLanguage) => Array.filter(SITE_LANGUAGES, (language) => language !== preferredLanguage);

// The section is the only optional article attribution: when it is absent it contributes no tag
// at all, which is a single nullish test rather than Option ceremony
const articleSectionTag = (articleSection: "employment" | "portfolio" | undefined): ReadonlyArray<MetaTag> =>
  articleSection === undefined ? [] : [{ property: "article:section", content: articleSection }];

const articleMetaTags = (ogType: "website" | "article", articleSection?: "employment" | "portfolio"): ReadonlyArray<MetaTag> =>
  ogType === "article"
    ? [{ property: "article:author", content: AUTHOR_URL }, { property: "article:publisher", content: PUBLISHER_URL }, ...articleSectionTag(articleSection)]
    : [];

export const socialMeta = ({
  title,
  description,
  canonical,
  image,
  preferredLanguage,
  ogType = "website",
  articleSection,
}: SocialMetaInput): ReadonlyArray<MetaTag> => {
  // Twitter Card uses JPEG banner for universal preview compatibility
  const banner = globalSocialImage(preferredLanguage);

  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    // The absolute HTTPS og:image makes the optional url and secure_url aliases redundant
    { property: "og:image", content: image.src },
    { property: "og:image:alt", content: image.alt },
    { property: "og:image:type", content: image.mime },
    { property: "og:image:width", content: `${image.width}` },
    { property: "og:image:height", content: `${image.height}` },
    { property: "og:type", content: ogType },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: OPEN_GRAPH_LOCALES[preferredLanguage] },
    ...Array.map(alternateLocales(preferredLanguage), (language) => ({
      property: "og:locale:alternate",
      content: OPEN_GRAPH_LOCALES[language],
    })),
    ...articleMetaTags(ogType, articleSection),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: banner.src },
    { name: "twitter:image:alt", content: banner.alt },
  ];
};

// OpenGraph and Twitter Card metadata generators.

// services, features, and other libraries
import { Array } from "effect";

// constants
import { AUTHOR_URL, GLOBAL_SOCIAL_IMAGE, OPEN_GRAPH_LOCALES, PUBLISHER_URL, SITE_LANGUAGES, SITE_NAME } from "./constants";

// types
import type { MetaTag } from "./models";
import type { PreferredLanguage } from "@/domain/models";

// Verified facts about a published image file.
export interface SocialImageFacts {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

// Image facts paired with alt text describing the specific card picture.
export interface SocialImage extends SocialImageFacts {
  readonly alt: string;
}

// Input fields for building OpenGraph and Twitter card meta tags.
export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly twitterImage?: SocialImage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: "employment" | "portfolio";
}

// Supported alternate locales for og:locale:alternate tags.
const alternateLocales = (preferredLanguage: PreferredLanguage) => Array.filter(SITE_LANGUAGES, (language) => language !== preferredLanguage);

export const socialMeta = ({
  title,
  description,
  canonical,
  image,
  preferredLanguage,
  twitterImage,
  ogType = "website",
  articleSection,
}: SocialMetaInput): ReadonlyArray<MetaTag> => {
  const twitter = twitterImage ?? GLOBAL_SOCIAL_IMAGE;

  // Article pages publish author and publisher profile URLs for authoritative attribution.
  const attribution: ReadonlyArray<MetaTag> =
    ogType === "article"
      ? [
          { property: "article:author", content: AUTHOR_URL },
          { property: "article:publisher", content: PUBLISHER_URL },
        ]
      : [];

  const section: ReadonlyArray<MetaTag> = ogType === "article" && articleSection ? [{ property: "article:section", content: articleSection }] : [];

  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image.src },
    { property: "og:image:url", content: image.src },
    { property: "og:image:alt", content: image.alt },
    { property: "og:image:type", content: image.mime },
    { property: "og:image:width", content: `${image.width}` },
    { property: "og:image:height", content: `${image.height}` },
    { property: "og:image:secure_url", content: image.src },
    { property: "og:type", content: ogType },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: OPEN_GRAPH_LOCALES[preferredLanguage] },
    ...Array.map(alternateLocales(preferredLanguage), (language) => ({ property: "og:locale:alternate", content: OPEN_GRAPH_LOCALES[language] })),
    ...attribution,
    ...section,
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: twitter.src },
    { name: "twitter:image:alt", content: twitter.alt },
  ];
};

// Open Graph and Twitter Card meta tags shared by every page head.
// Built once from a SocialMetaInput so the HTML <head>, JSON-LD graph, and Markdown twins
// never disagree about a page's title, description, image, or language.

// services, features, and other libraries
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { MetaTag, SocialImage } from "./models";

// constants
import { AUTHOR_URL, GLOBAL_SOCIAL_IMAGE, OPEN_GRAPH_LOCALES, PUBLISHER_URL, SITE_NAME } from "./constants";
import { SITE_LANGUAGES } from "@/domain/constants";

export const globalSocialImage = (preferredLanguage: PreferredLanguage): SocialImage => ({
  ...GLOBAL_SOCIAL_IMAGE,
  alt: matchPreferredLanguage(
    preferredLanguage,
    "Portfolio collage showing web development skills and project screenshots",
    "Kolaż portfolio przedstawiający umiejętności tworzenia stron i zrzuty projektów"
  ),
});

export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: "employment" | "portfolio";
}

const alternateLocales = (preferredLanguage: PreferredLanguage) => SITE_LANGUAGES.filter((language) => language !== preferredLanguage);

export const socialMeta = ({
  title,
  description,
  canonical,
  image,
  preferredLanguage,
  ogType = "website",
  articleSection,
}: SocialMetaInput): ReadonlyArray<MetaTag> => [
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
  ...alternateLocales(preferredLanguage).map((language) => ({
    property: "og:locale:alternate",
    content: OPEN_GRAPH_LOCALES[language],
  })),
  ...(ogType === "article"
    ? [
        { property: "article:author", content: AUTHOR_URL },
        { property: "article:publisher", content: PUBLISHER_URL },
        ...(articleSection ? [{ property: "article:section", content: articleSection }] : []),
      ]
    : []),
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: title },
  { name: "twitter:description", content: description },
  // X rejects WebP, so the Twitter card always uses the JPEG banner instead of the WebP screenshot.
  { name: "twitter:image", content: GLOBAL_SOCIAL_IMAGE.src },
  { name: "twitter:image:alt", content: globalSocialImage(preferredLanguage).alt },
];

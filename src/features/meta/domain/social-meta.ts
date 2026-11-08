// Open Graph and Twitter Card meta tags shared by every page head.
// Built once from a SocialMetaInput so the HTML <head>, JSON-LD graph, and Markdown twins
// never disagree about a page's title, description, image, or language.

// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// constants
import { AUTHOR_URL, GLOBAL_SOCIAL_IMAGE, PUBLISHER_URL, SITE_NAME } from "./identity";
import { OPEN_GRAPH_LOCALES } from "./languages";
import { SITE_LANGUAGES } from "@/domain/constants";

// types
import type { SocialImageFacts } from "./identity";
import type { PreferredLanguage } from "@/domain/models";
import type { MetaTag } from "./models";

// A published card image: the verified file facts plus the alt text describing this page's card.
export interface SocialImage extends SocialImageFacts {
  readonly alt: string;
}

// The Open Graph / Twitter card every page head publishes. It is the page's social contract
// declared apart from its structural links and graph, so a head cannot inherit one surface's
// fields into another that reads them differently.
export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: "employment" | "portfolio";
}

export const globalSocialImage = (preferredLanguage: PreferredLanguage): SocialImage => ({
  ...GLOBAL_SOCIAL_IMAGE,
  alt: matchPreferredLanguage(
    preferredLanguage,
    "Portfolio collage showing web development skills and project screenshots",
    "Kolaż portfolio przedstawiający umiejętności tworzenia stron i zrzuty projektów"
  ),
});

const alternateLocales = (preferredLanguage: PreferredLanguage) => Array.filter(SITE_LANGUAGES, (language) => language !== preferredLanguage);

const articleMetaTags = (ogType: "website" | "article", articleSection?: "employment" | "portfolio"): ReadonlyArray<MetaTag> =>
  ogType === "article"
    ? Array.getSomes([
        Option.some<MetaTag>({ property: "article:author", content: AUTHOR_URL }),
        Option.some<MetaTag>({ property: "article:publisher", content: PUBLISHER_URL }),
        pipe(
          Option.fromNullishOr(articleSection),
          Option.map((section): MetaTag => ({ property: "article:section", content: section }))
        ),
      ])
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
  // The Twitter card always shows the JPEG banner (X rejects WebP), so its image and alt describe
  // the banner regardless of which picture og:image publishes.
  const banner = globalSocialImage(preferredLanguage);

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

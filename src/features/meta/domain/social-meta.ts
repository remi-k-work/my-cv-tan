// services, features, and other libraries
import { Array, Match, Option, Result, pipe } from "effect";
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

const articleTags = (ogType: "website" | "article", articleSection: SocialMetaInput["articleSection"]): ReadonlyArray<MetaTag> =>
  Match.value(ogType).pipe(
    Match.when("website", () => []),
    // Only document-like detail pages claim article authorship and a section
    Match.when("article", () => [
      { property: "article:author", content: AUTHOR_URL },
      { property: "article:publisher", content: PUBLISHER_URL },
      ...pipe(
        Option.fromUndefinedOr(articleSection),
        Option.map((section) => ({ property: "article:section", content: section })),
        Option.toArray
      ),
    ]),
    Match.exhaustive
  );

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
  ...Array.filterMap(SITE_LANGUAGES, (language) =>
    language === preferredLanguage ? Result.failVoid : Result.succeed({ property: "og:locale:alternate", content: OPEN_GRAPH_LOCALES[language] })
  ),
  ...articleTags(ogType, articleSection),
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: title },
  { name: "twitter:description", content: description },
  // X supports WebP; use the page-specific image and its matching alt instead of a generic banner
  { name: "twitter:image", content: image.src },
  { name: "twitter:image:alt", content: image.alt },
];

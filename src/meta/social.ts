// services, features, and other libraries
import { absoluteUrl } from "./helpers";

// constants
import { GLOBAL_IMAGE, SITE_NAME } from "./constants";

// types
export interface SocialImage {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width?: number;
  readonly height?: number;
}

interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly image: SocialImage;
  readonly ogType: "website" | "article";
  readonly twitterImage?: SocialImage;
}

// Global share image: jpeg with known dimensions
export const globalSocialImage = (): SocialImage => ({ src: GLOBAL_IMAGE, mime: "image/jpeg", width: 1200, height: 630 });

// Shared Open Graph + Twitter Card tags for a page.
// X/Twitter cards only reliably accept jpeg/png, so twitterImage defaults to the jpeg fallback.
export const socialMeta = ({ title, description, path, image, ogType, twitterImage }: SocialMetaInput) => {
  const twitter = twitterImage ?? globalSocialImage();

  // Only assert dimensions when both are known; never emit wrong ones
  const dimensions =
    image.width !== undefined && image.height !== undefined
      ? ([
          { property: "og:image:width", content: `${image.width}` },
          { property: "og:image:height", content: `${image.height}` },
        ] as const)
      : ([] as const);

  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image.src },
    { property: "og:image:alt", content: description },
    { property: "og:image:type", content: image.mime },
    ...dimensions,
    { property: "og:type", content: ogType },
    { property: "og:url", content: absoluteUrl(path) },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:locale:alternate", content: "pl_PL" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: twitter.src },
    { name: "twitter:image:alt", content: description },
  ] as const;
};

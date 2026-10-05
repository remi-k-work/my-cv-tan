// services, features, and other libraries
import { Option, pipe } from "effect";
import { absoluteUrl } from "./helpers";

// types
import type { SocialMetaInput } from "./models";

// constants
import { GLOBAL_SOCIAL_IMAGE, SITE_NAME } from "./constants";

// Shared Open Graph + Twitter Card tags for a page.
// X/Twitter cards only reliably accept jpeg/png, so twitterImage defaults to the jpeg fallback.
export const socialMeta = ({ title, description, path, image, ogType, twitterImage }: SocialMetaInput) => {
  const twitter = twitterImage ?? GLOBAL_SOCIAL_IMAGE;

  // Only assert dimensions when both are known; never emit wrong ones
  const dimensions = pipe(
    Option.all({ width: Option.fromNullishOr(image.width), height: Option.fromNullishOr(image.height) }),
    Option.match({
      onNone: () => [] as const,
      onSome: ({ width, height }) =>
        [
          { property: "og:image:width", content: `${width}` },
          { property: "og:image:height", content: `${height}` },
        ] as const,
    })
  );

  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image.src },
    { property: "og:image:alt", content: title },
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
    { name: "twitter:image:alt", content: title },
  ] as const;
};

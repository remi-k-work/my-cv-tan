// services, features, and other libraries
import { absoluteUrl } from "./helpers";

// types
interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly image: string;
  readonly ogType: "website" | "article";
}

// constants
import { SITE_NAME } from "./constants";

// Shared Open Graph + Twitter Card tags for a page
export const socialMeta = ({ title, description, path, image, ogType }: SocialMetaInput) =>
  [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: description },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:type", content: ogType },
    { property: "og:url", content: absoluteUrl(path) },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:locale:alternate", content: "pl_PL" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: description },
  ] as const;

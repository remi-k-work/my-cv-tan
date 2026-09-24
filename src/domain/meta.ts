// types
import type { RootHead } from ".";

// constants
import { DESCRIPTION, TITLE } from ".";

export const ROOT_HEAD = {
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { title: TITLE },
    {
      name: "description",
      content: DESCRIPTION,
    },

    { name: "author", content: "Remi" },
    { name: "robots", content: "index, follow" },
    { name: "category", content: "technology" },
    { name: "google", content: "notranslate" },

    // Open Graph
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:image", content: "https://www.remiforge.dev/opengraph-image.jpg" },
    { property: "og:image:alt", content: DESCRIPTION },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:type", content: "portfolio" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESCRIPTION },
    { name: "twitter:image", content: "https://www.remiforge.dev/twitter-image.jpg" },
    { name: "twitter:image:alt", content: DESCRIPTION },
    { name: "twitter:image:type", content: "image/jpeg" },
    { name: "twitter:image:width", content: "1200" },
    { name: "twitter:image:height", content: "630" },
  ],
  links: [
    { rel: "canonical", href: "https://www.remiforge.dev" },
    { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    { rel: "og:image", href: "https://www.remiforge.dev/opengraph-image.jpg" },
    { rel: "twitter:image", href: "https://www.remiforge.dev/twitter-image.jpg" },
  ],
} as const satisfies RootHead;

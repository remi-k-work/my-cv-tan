// services, features, and other libraries
import { excerpt } from "@/domain";
import { globalSocialImage, socialMeta } from "./social";
import { websitePersonJsonLd } from "./json-ld";

// types
import type { DocumentHead } from "./constants";

// constants
import { DESCRIPTION, META_DESCRIPTION_LENGTH, SITE_NAME, TITLE } from "./constants";

export const ROOT_HEAD = {
  meta: [
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { name: "theme-color", content: "#1d2549" },
    { title: TITLE },
    {
      name: "description",
      content: excerpt(DESCRIPTION, META_DESCRIPTION_LENGTH),
    },

    { name: "author", content: SITE_NAME },
    { name: "robots", content: "index, follow" },
    { name: "category", content: "technology" },
    { name: "google", content: "notranslate" },
    ...socialMeta({ title: TITLE, description: excerpt(DESCRIPTION, META_DESCRIPTION_LENGTH), path: "/", image: globalSocialImage(), ogType: "website" }),
  ],
  links: [{ rel: "icon", href: "/icon.svg", type: "image/svg+xml" }],
  scripts: [websitePersonJsonLd()],
} as const satisfies DocumentHead;

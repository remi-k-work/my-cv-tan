// services, features, and other libraries
import { jsonLdGraph } from "./core";

// constants
import {
  AVATAR_IMAGE,
  DESCRIPTION,
  GLOBAL_IMAGE,
  GLOBAL_SOCIAL_IMAGE,
  HOME_COUNTRY,
  HOME_LOCALITY,
  JOB_TITLE,
  KNOWS_ABOUT,
  PERSON_ID,
  PUBLISHER_ID,
  SITE_DESCRIPTION,
  SITE_LANGUAGES,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
  WEBSITE_ID,
} from "../constants";

// Site-wide structured data: the site itself plus its author and publisher
export const websitePersonJsonLd = () =>
  jsonLdGraph([
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      // Same capped copy as the root meta description: one extractable summary everywhere
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      inLanguage: [...SITE_LANGUAGES],
      author: { "@id": PERSON_ID },
      publisher: { "@id": PUBLISHER_ID },
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: SITE_NAME,
      // The full bio gives AI systems a rich, quotable identity beyond the site summary
      description: DESCRIPTION,
      url: SITE_URL,
      image: AVATAR_IMAGE,
      jobTitle: JOB_TITLE,
      knowsAbout: [...KNOWS_ABOUT],
      // The site's bilingual audience is a factual GEO signal for AI extraction
      knowsLanguage: [...SITE_LANGUAGES],
      homeLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: HOME_LOCALITY,
          addressCountry: HOME_COUNTRY,
        },
      },
      sameAs: [...SOCIAL_LINKS],
    },
    {
      "@type": "Organization",
      "@id": PUBLISHER_ID,
      name: SITE_NAME,
      url: SITE_URL,
      // Dimensions single-sourced from the share image constant
      logo: { "@type": "ImageObject", url: GLOBAL_IMAGE, width: GLOBAL_SOCIAL_IMAGE.width, height: GLOBAL_SOCIAL_IMAGE.height },
      sameAs: [...SOCIAL_LINKS],
    },
  ]);

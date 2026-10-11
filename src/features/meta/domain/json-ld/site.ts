// services, features, and other libraries
import { imageObject, jsonLdGraph } from "./core";

// constants
import {
  AVATAR,
  DESCRIPTION,
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
      // Avatar as a sized ImageObject: same headshot everywhere, dimensions included
      image: imageObject(AVATAR.src, AVATAR.width, AVATAR.height),
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
      // Square avatar, not the wide OG banner: Google wants a logo-shaped image for the knowledge panel
      logo: imageObject(AVATAR.src, AVATAR.width, AVATAR.height),
      sameAs: [...SOCIAL_LINKS],
    },
  ]);

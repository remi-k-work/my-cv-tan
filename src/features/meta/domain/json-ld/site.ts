// services, features, and other libraries
import { imageObject, jsonLdGraph } from "./core";

// constants
import {
  AVATAR,
  PERSON_DESCRIPTION,
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
} from "@/features/meta/domain/constants";

// Physical locality shared between Person and Organization for consistent geographical entity grounding
const POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: HOME_LOCALITY,
  addressCountry: HOME_COUNTRY,
} as const;

// Site-wide structured graph declaring WebSite, Person, and Organization entities with stable URI @id references
export const websitePersonJsonLd = () =>
  jsonLdGraph([
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
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
      description: PERSON_DESCRIPTION,
      url: SITE_URL,
      // Square ImageObject satisfies Google Knowledge Graph logo/author requirements (>=112x112 px)
      image: imageObject(AVATAR.src, AVATAR.width, AVATAR.height),
      jobTitle: JOB_TITLE,
      knowsAbout: [...KNOWS_ABOUT],
      knowsLanguage: [...SITE_LANGUAGES],
      address: POSTAL_ADDRESS,
      sameAs: [...SOCIAL_LINKS],
    },
    {
      "@type": "Organization",
      "@id": PUBLISHER_ID,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      address: POSTAL_ADDRESS,
      logo: imageObject(AVATAR.src, AVATAR.width, AVATAR.height),
      sameAs: [...SOCIAL_LINKS],
    },
  ]);

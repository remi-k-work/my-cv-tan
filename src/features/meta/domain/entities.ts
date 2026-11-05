// Site-wide schema.org entities (WebSite, Person, Organization) merged into every page graph.
// Built from the node primitives in ./nodes and the shared constants.

// constants
import {
  AVATAR,
  HOME_COUNTRY,
  HOME_LOCALITY,
  HOME_URL,
  JOB_TITLE,
  KNOWS_ABOUT,
  PERSON_DESCRIPTION,
  PERSON_ID,
  PUBLISHER_ID,
  SITE_DESCRIPTION,
  SITE_LANGUAGES,
  SITE_NAME,
  SOCIAL_LINKS,
  WEBSITE_ID,
} from "./constants";
import { imageObject } from "./nodes";

// types
import type { JsonLdNode } from "./models";

const POSTAL_ADDRESS = { "@type": "PostalAddress", addressLocality: HOME_LOCALITY, addressCountry: HOME_COUNTRY } as const;
const AVATAR_IMAGE_OBJECT = imageObject(AVATAR.src, AVATAR.width, AVATAR.height);

// Site-wide entities merged into every page head.
export const siteNodes: ReadonlyArray<JsonLdNode> = [
  {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: HOME_URL,
    inLanguage: [...SITE_LANGUAGES],
    author: { "@id": PERSON_ID },
    publisher: { "@id": PUBLISHER_ID },
  },
  {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_NAME,
    alternateName: "Remi Forge",
    description: PERSON_DESCRIPTION,
    url: HOME_URL,
    image: AVATAR_IMAGE_OBJECT,
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
    url: HOME_URL,
    address: POSTAL_ADDRESS,
    logo: AVATAR_IMAGE_OBJECT,
    sameAs: [...SOCIAL_LINKS],
    member: { "@id": PERSON_ID },
  },
] as const;

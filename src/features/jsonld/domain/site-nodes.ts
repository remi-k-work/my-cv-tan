// The site-wide JSON-LD root entities included in every page graph; they are structured data, not
// site identity, so they live beside the graph builders that use them

// types
import type { JsonLdNode } from "./models";

// constants
import {
  AVATAR,
  CONTACT_EMAIL,
  HOME_COUNTRY,
  HOME_COUNTRY_NAME,
  HOME_LOCALITY,
  HOME_URL,
  JOB_TITLE,
  KNOWS_ABOUT,
  PERSON_DESCRIPTION,
  PERSON_ID,
  PUBLISHER_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  SOCIAL_LINKS,
  WEBSITE_ID,
} from "@/domain/site";
import { SITE_LANGUAGES } from "@/domain/constants";

const POSTAL_ADDRESS = { "@type": "PostalAddress", addressLocality: HOME_LOCALITY, addressCountry: HOME_COUNTRY } as const;
const HOME_PLACE = { "@type": "Place", name: `${HOME_LOCALITY}, ${HOME_COUNTRY_NAME}`, address: POSTAL_ADDRESS } as const;
const AVATAR_IMAGE_OBJECT = { "@type": "ImageObject", url: AVATAR.src, width: AVATAR.width, height: AVATAR.height } as const;

// Site-wide root entities included in every page graph
export const SITE_NODES: ReadonlyArray<JsonLdNode> = [
  {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: HOME_URL,
    inLanguage: [...SITE_LANGUAGES],
    mainEntity: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
    publisher: { "@id": PUBLISHER_ID },
  },
  {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_NAME,
    description: PERSON_DESCRIPTION,
    url: HOME_URL,
    image: AVATAR_IMAGE_OBJECT,
    // The public address is already published by llms.txt and the contact page; keeping it on the
    // site-wide Person makes the entity self-contained for parsers that never fetch a second page
    email: CONTACT_EMAIL,
    jobTitle: JOB_TITLE,
    knowsAbout: [...KNOWS_ABOUT],
    knowsLanguage: [...SITE_LANGUAGES],
    address: POSTAL_ADDRESS,
    homeLocation: HOME_PLACE,
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

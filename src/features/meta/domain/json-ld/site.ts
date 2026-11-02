// services, features, and other libraries
import { imageObject } from "./core";
import { absoluteUrl } from "../url";

// constants
import {
  AVATAR,
  HOME_COUNTRY,
  HOME_LOCALITY,
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
} from "../constants";

// Physical locality shared between Person and Organization for consistent geographical entity grounding
const POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: HOME_LOCALITY,
  addressCountry: HOME_COUNTRY,
} as const;

// The square avatar is the one image the site publishes; the two logo-shaped consumers read it
// instead of the wide OG banner. Shared as one value rather than copied per node: the graph merge
// (see jsonLdGraph) writes a new object whenever it has to fold two @ids, so nothing mutates this
const AVATAR_IMAGE_OBJECT = imageObject(AVATAR.src, AVATAR.width, AVATAR.height);

// The homepage canonical (trailing slash)
const HOME_URL = absoluteUrl("/");

// Site-wide nodes declaring the WebSite, Person and Organization entities with stable URI @id
// references. Exported as a node list rather than a finished script so each page head merges these
// into its own single @graph: splitting them into a second block is what Google specifically
// advises against, because a parser would have to reconcile two documents before it could resolve
// the Person a page's mainEntity points at. All three nodes share the homepage URL and reciprocal
// edges (author/publisher/member) so the graph triangle closes in one parse pass.
export const siteNodes = [
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
    // alternateName is an alias that helps knowledge-graph disambiguation without fabricating a
    // second identity.
    alternateName: "Remi Forge",
    description: PERSON_DESCRIPTION,
    url: HOME_URL,
    // A square ImageObject satisfies Google Knowledge Graph logo/author requirements (>=112x112 px)
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
    // Reciprocal of the page graphs' publisher edges: the organization claims its person by @id
    member: { "@id": PERSON_ID },
  },
] as const;

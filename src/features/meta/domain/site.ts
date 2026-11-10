// The site-identity vocabulary published onto every machine-readable surface: the origin, the
// entity ids the JSON-LD graph merges on, the authored copy, the social profiles and images, and
// the degraded (not-found / unavailable) copy. This module is a leaf: it imports no serializer and
// no discovery constant, so every other meta module — and the Markdown feature — can depend on it
// without a cycle.

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdNode } from "./models";

// constants
import { SITE_LANGUAGES } from "@/domain/constants";

export const SITE_URL = "https://www.remiforge.dev";
export const HOME_URL = `${SITE_URL}/`;
export const AUTHOR_URL = HOME_URL;
export const PUBLISHER_URL = HOME_URL;

// Fragment identifiers used for graph merging
export const WEBSITE_ID = `${HOME_URL}#website`;
export const PERSON_ID = `${HOME_URL}#person`;
export const PUBLISHER_ID = `${HOME_URL}#publisher`;
export const PROFILE_ID = `${HOME_URL}#profile`;
export const EXPERIENCE_LIST_ID = `${HOME_URL}#experience-list`;
export const PORTFOLIO_LIST_ID = `${HOME_URL}#portfolio-list`;

export const SITE_NAME = "Remi Forge";
export const HOME_TITLE = "Web Developer in Rzeszów, Poland";

export const PERSON_DESCRIPTION =
  "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.";

export const SITE_DESCRIPTION =
  "Remi Forge is a web developer in Rzeszów, Poland, building modern web applications with React, TypeScript, and full-stack tools.";

export const META_DESCRIPTION_LENGTH = 160;

export const BRANDED_TITLE = (title: string) => `${SITE_NAME} ● ${title}`;

export const JOB_TITLE = "Web Developer";
export const KNOWS_ABOUT = ["Web Development", "TypeScript", "React", "Next.js", "Effect", "Front-End Development", "Full-Stack Development"] as const;

export const SOCIAL_PROFILES = [
  { name: "GitHub", href: "https://github.com/remi-k-work" },
  { name: "LinkedIn", href: "https://linkedin.com/in/remi-k-work" },
] as const;

export const SOCIAL_LINKS = SOCIAL_PROFILES.map(({ href }) => href);

export const HOME_LOCALITY = "Rzeszów";
export const HOME_COUNTRY = "PL";
export const HOME_COUNTRY_NAME = "Poland";
export const HOME_LOCATION = `${HOME_LOCALITY}, ${HOME_COUNTRY_NAME}`;

// Query parameter used for explicit language override in markdown twins
export const LANG_PARAM = "lang";

export const GLOBAL_SOCIAL_IMAGE = { src: `${SITE_URL}/opengraph-image.jpg`, mime: "image/jpeg", width: 1200, height: 630 } as const;
export const AVATAR = { src: `${SITE_URL}/avatar.jpg`, width: 288, height: 288 } as const;

export const NOT_FOUND_COPY = {
  en: { title: "Not Found", description: "The requested page could not be found." },
  pl: { title: "Nie znaleziono", description: "Nie znaleziono żądanej strony." },
} as const satisfies Readonly<Record<PreferredLanguage, { title: string; description: string }>>;

export const UNAVAILABLE_COPY = {
  en: { title: "Page unavailable", description: "This page is temporarily unavailable." },
  pl: { title: "Strona niedostępna", description: "Ta strona jest tymczasowo niedostępna." },
} as const satisfies Readonly<Record<PreferredLanguage, { title: string; description: string }>>;

export const POSTAL_ADDRESS = { "@type": "PostalAddress", addressLocality: HOME_LOCALITY, addressCountry: HOME_COUNTRY } as const;
export const AVATAR_IMAGE_OBJECT = { "@type": "ImageObject", url: AVATAR.src, width: AVATAR.width, height: AVATAR.height } as const;

// Site-wide root entities included in every page graph
export const SITE_NODES: ReadonlyArray<JsonLdNode> = [
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

export const OPEN_GRAPH_LOCALES = { en: "en_US", pl: "pl_PL" } as const satisfies Record<PreferredLanguage, string>;

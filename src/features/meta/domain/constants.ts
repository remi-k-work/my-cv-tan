// services, features, and other libraries
import { joinLinkHeader } from "./helpers";
import { imageObject } from "./nodes";
import { absoluteUrl } from "./urls";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { DegradedCopy, JsonLdNode, LinkTag, PageHead, SocialImageFacts } from "./models";

// constants
import { SITE_LANGUAGES } from "@/domain/constants";
import { INDEXABLE_ROBOTS, NO_STORE, NOINDEX_FOLLOW, RETRY_AFTER } from "@/domain/http";

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

export const GLOBAL_SOCIAL_IMAGE: SocialImageFacts = { src: `${SITE_URL}/opengraph-image.jpg`, mime: "image/jpeg", width: 1200, height: 630 };
export const AVATAR: Omit<SocialImageFacts, "mime"> = { src: `${SITE_URL}/avatar.jpg`, width: 288, height: 288 };

// Content signal defining crawler permissions across robots.txt and HTTP headers
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

export const LLMS_TXT_HREF = "/llms.txt";
export const LLMS_FULL_TXT_HREF = "/llms-full.txt";
export const SITEMAP_HREF = "/sitemap.xml";
export const ROBOTS_TXT_HREF = "/robots.txt";

export const CV_EN_HREF = "/my-cv.pdf";
export const CV_PL_HREF = "/my-cv-pl.pdf";
export const CERTIFICATES_HREF = "/my-certificates.pdf";

export const DOWNLOADABLE_DOCUMENTS = [
  { label: "CV (English)", href: CV_EN_HREF },
  { label: "CV (Polish)", href: CV_PL_HREF },
  { label: "Certificates", href: CERTIFICATES_HREF },
] as const;

export const DOWNLOADABLE_DOCUMENT_PATHS = DOWNLOADABLE_DOCUMENTS.map(({ href }) => href);

export const NOT_FOUND_COPY: Readonly<Record<PreferredLanguage, DegradedCopy>> = {
  en: { title: "Not Found", description: "The requested page could not be found." },
  pl: { title: "Nie znaleziono", description: "Nie znaleziono żądanej strony." },
};

export const UNAVAILABLE_COPY: Readonly<Record<PreferredLanguage, DegradedCopy>> = {
  en: { title: "Page unavailable", description: "This page is temporarily unavailable." },
  pl: { title: "Strona niedostępna", description: "Ta strona jest tymczasowo niedostępna." },
};

export const POSTAL_ADDRESS = { "@type": "PostalAddress", addressLocality: HOME_LOCALITY, addressCountry: HOME_COUNTRY } as const;
export const AVATAR_IMAGE_OBJECT = imageObject(AVATAR.src, AVATAR.width, AVATAR.height);

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

export const SITE_LANGUAGE_NAMES = { en: "English", pl: "Polish" } as const satisfies Readonly<Record<PreferredLanguage, string>>;
export const OPEN_GRAPH_LOCALES = { en: "en_US", pl: "pl_PL" } as const satisfies Record<PreferredLanguage, string>;

export const DEFAULT_LANGUAGE = "en" as const satisfies PreferredLanguage;
export const NEGOTIATION_VARY_TOKENS = ["Cookie", "Accept-Language"] as const;

// Discovery indexes projected into <head> and Link headers
export const LLMS_TXT_INDEX = { name: "llms.txt", url: absoluteUrl(LLMS_TXT_HREF) } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", url: absoluteUrl(LLMS_FULL_TXT_HREF) } as const;
export const AI_INDEXES = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;

export const SITEMAP_LINK = { rel: "sitemap", href: absoluteUrl(SITEMAP_HREF) };
export const LLMS_DISCOVERY_LINK: LinkTag = { rel: "llms", href: LLMS_TXT_INDEX.url };

export const AI_INDEX_LINKS: ReadonlyArray<LinkTag> = AI_INDEXES.map(({ name, url }) => ({ rel: "alternate", type: "text/plain", title: name, href: url }));
export const AI_INDEX_LINK_HEADER = joinLinkHeader(AI_INDEX_LINKS);

export const ME_LINKS: ReadonlyArray<LinkTag> = SOCIAL_LINKS.map((href) => ({ rel: "me", href }));
export const EMPTY_PAGE_HEAD: PageHead = { meta: [], links: [], scripts: [] };

// Query parameter used for explicit language override in markdown twins
export const LANG_PARAM = "lang";

// HTTP metadata headers for caching, robots indexing directives, and language negotiation
export const MACHINE_HEADERS = { "Content-Signal": CONTENT_SIGNAL, Link: AI_INDEX_LINK_HEADER } as const;

export const CACHEABLE_HEADERS = { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } as const;

export const NOINDEX_HEADERS = { "X-Robots-Tag": NOINDEX_FOLLOW } as const;
export const UNAVAILABLE_HEADERS = { "Cache-Control": NO_STORE, ...NOINDEX_HEADERS } as const;
export const SERVICE_UNAVAILABLE_HEADERS = { ...UNAVAILABLE_HEADERS, "Retry-After": RETRY_AFTER } as const;

export const INDEXABLE_HEADERS = { "X-Robots-Tag": INDEXABLE_ROBOTS } as const;

export const TXT_HEADERS = { ...MACHINE_HEADERS, "Content-Type": "text/plain; charset=utf-8", "Content-Language": DEFAULT_LANGUAGE } as const;
export const SITEMAP_HEADERS = { ...MACHINE_HEADERS, "Content-Type": "application/xml; charset=utf-8" } as const;
export const SITEMAP_UNAVAILABLE_XML = '<?xml version="1.0" encoding="UTF-8"?><error>Sitemap is temporarily unavailable.</error>';

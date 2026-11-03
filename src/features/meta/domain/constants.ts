// Shared constants for metadata, discovery documents, and structured data.

// types
import type { PreferredLanguage } from "@/domain/models";

// --- Site identity ---

export const SITE_URL = "https://www.remiforge.dev";
export const SITE_NAME = "Remi Forge";
export const HOME_TITLE = "Web Developer in Rzeszów, Poland";

// --- Brand copy ---

// Rich biography for schema.org Person and AI prose.
export const PERSON_DESCRIPTION =
  "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.";

// Concise search summary for metadata.
export const SITE_DESCRIPTION =
  "Remi Forge is a web developer in Rzeszów, Poland, building modern web applications with React, TypeScript, and full-stack tools.";

// Authoritative author profile and publisher URLs.
export const AUTHOR_URL = `${SITE_URL}/`;
export const PUBLISHER_URL = `${SITE_URL}/`;

// Upper bound for search engine snippet lengths.
export const META_DESCRIPTION_LENGTH = 160;

// Document title template shared by HTML heads and Markdown frontmatter.
export const BRANDED_TITLE = (title: string) => `${SITE_NAME} ● ${title}`;

// --- Author identity ---

export const JOB_TITLE = "Web Developer";
export const KNOWS_ABOUT = ["Web Development", "TypeScript", "React", "Next.js", "Effect", "Front-End Development", "Full-Stack Development"] as const;

// Social profiles declared once for JSON-LD sameAs, rel="me", and markdown twins.
export const SOCIAL_PROFILES = [
  { name: "GitHub", href: "https://github.com/remi-k-work" },
  { name: "LinkedIn", href: "https://linkedin.com/in/remi-k-work" },
] as const;

export const SOCIAL_LINKS = SOCIAL_PROFILES.map(({ href }) => href);

export const HOME_LOCALITY = "Rzeszów";
export const HOME_COUNTRY = "PL";
export const HOME_COUNTRY_NAME = "Poland";

// --- Images ---

// Standard 1200x630 Open Graph share image.
export const GLOBAL_SOCIAL_IMAGE = {
  src: `${SITE_URL}/opengraph-image.jpg`,
  alt: `${SITE_NAME} — ${HOME_TITLE}`,
  mime: "image/jpeg",
  width: 1200,
  height: 630,
} as const;

// Square headshot satisfying schema.org logo and avatar requirements.
export const AVATAR = { src: `${SITE_URL}/avatar.jpg`, width: 288, height: 288 } as const;

// --- Languages ---

export const DEFAULT_LANGUAGE = "en" as const;

// Content languages supported across metadata and discovery documents.
export const SITE_LANGUAGES = ["en", "pl"] as const;

export const SITE_LANGUAGE_NAMES = { en: "English", pl: "Polish" } as const satisfies Readonly<Record<PreferredLanguage, string>>;

export const OPEN_GRAPH_LOCALES = { en: "en_US", pl: "pl_PL" } as const satisfies Record<PreferredLanguage, string>;

// --- JSON-LD node ids ---

export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/#person`;
export const PUBLISHER_ID = `${SITE_URL}/#publisher`;
export const PROFILE_ID = `${SITE_URL}/#profile`;

// --- Machine-readable discovery documents (GEO) ---

// Content signal defining crawler permissions across robots.txt and HTTP headers.
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

export const LLMS_TXT_HREF = "/llms.txt";
export const LLMS_FULL_TXT_HREF = "/llms-full.txt";
export const SITEMAP_HREF = "/sitemap.xml";
export const ROBOTS_TXT_HREF = "/robots.txt";
export const HOME_MD_HREF = "/index.md";
export const EDUCATION_MD_HREF = "/education.md";
export const CONTACT_MD_HREF = "/contact.md";

// Downloadable document links exposed to crawlers.
export const CV_EN_HREF = "/my-cv.pdf";
export const CV_PL_HREF = "/my-cv-pl.pdf";
export const CERTIFICATES_HREF = "/my-certificates.pdf";

// --- HTTP responses ---

// Shared CDN cache policy for machine-readable discovery assets.
export const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";

// Vary header ensuring caches distinguish content by language cookie and header.
export const LANGUAGE_VARY = "Cookie, Accept-Language";

export const NO_STORE = "no-store";
export const NOINDEX_FOLLOW = "noindex, follow";

// Robots directive permitting full snippets and large previews for indexable pages.
export const INDEXABLE_ROBOTS = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

// Crawl pacing request delay for training bots.
export const CRAWL_DELAY = "10";

export const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";
export const MD_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const XML_CONTENT_TYPE = "application/xml; charset=utf-8";

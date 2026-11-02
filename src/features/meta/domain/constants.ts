// Every value the HTML heads, the Markdown twins, robots.txt and the JSON-LD graphs share. The
// whole point of this file is that no surface may re-declare one of these facts.

// types
import type { PreferredLanguage } from "@/domain/models";

// --- Site identity ---

export const SITE_URL = "https://www.remiforge.dev";
export const SITE_NAME = "Remi Forge";
export const HOME_TITLE = "Web Developer in Rzeszów, Poland";

// --- Brand copy ---

// The full bio: a rich, quotable identity for the Person node and AI-facing prose
export const PERSON_DESCRIPTION =
  "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.";

// Search summaries stay authored and concise instead of being cut from long page copy
export const SITE_DESCRIPTION =
  "Remi Forge is a web developer in Rzeszów, Poland, building modern web applications with React, TypeScript, and full-stack tools.";

// The address og:article:author publishes. The GEO guide's authoritative-attribution step names a
// resolvable profile URL, not a display name, because a surface reading only the og: tags follows
// it as a link. The homepage is the one document that identifies the author — its JSON-LD is a
// ProfilePage whose mainEntity is the Person node — and the Person node itself declares this same
// string as its `url`, so the card attribution and the structured data cannot disagree.
//
// Spelled out rather than read off url.ts, because this module is imported by it and would
// otherwise form a cycle.
export const AUTHOR_URL = `${SITE_URL}/`;

// The publisher identity article:publisher resolves to. Same origin as the author URL but a
// distinct semantic role: the organization publishes, the person authors.
export const PUBLISHER_URL = `${SITE_URL}/`;

// Bounds excerpts from long project, experience, and school copy
export const META_DESCRIPTION_LENGTH = 160;

// Document title template shared by the HTML <title> and every Markdown frontmatter
export const BRANDED_TITLE = (title: string) => `${SITE_NAME} ● ${title}`;

// --- Author identity ---

// One source for JSON-LD (Person) and the llms.txt key facts
export const JOB_TITLE = "Web Developer";
export const KNOWS_ABOUT = [
  "Web Development",
  "TypeScript",
  "React",
  "Next.js",
  "Effect",
  "Front-End Development",
  "Full-Stack Development",
] as const;

// Labeled profiles: the one declaration of each profile name beside its URL. The JSON-LD sameAs
// edges, the root rel="me" links, the contact twin and the llms.txt Profiles section all read this.
export const SOCIAL_PROFILES = [
  { name: "GitHub", href: "https://github.com/remi-k-work" },
  { name: "LinkedIn", href: "https://linkedin.com/in/remi-k-work" },
] as const;

// The bare URL form for the two consumers that carry no label
export const SOCIAL_LINKS = SOCIAL_PROFILES.map(({ href }) => href);

// Twitter attribution: published as twitter:creator and twitter:site on article-like pages.
// undefined when no handle exists; the head builder omits the tag then.
export const TWITTER_HANDLE = undefined as string | undefined;

export const HOME_LOCALITY = "Rzeszów";
export const HOME_COUNTRY = "PL";
// Human-readable country for AI-facing prose; JSON-LD keeps the ISO code above
export const HOME_COUNTRY_NAME = "Poland";

// --- Images ---

// Global share image: jpeg with known dimensions (the bare URL is never published on its own).
// The alt names what the banner actually shows rather than the page a card was dropped onto.
export const GLOBAL_SOCIAL_IMAGE = {
  src: `${SITE_URL}/opengraph-image.jpg`,
  alt: `${SITE_NAME} — ${HOME_TITLE}`,
  mime: "image/jpeg",
  width: 1200,
  height: 630,
} as const;

// Square headshot with verified dimensions: the proper schema.org logo (Google wants >=112x112,
// ideally square).
export const AVATAR = { src: `${SITE_URL}/avatar.jpg`, width: 288, height: 288 } as const;

// --- Languages ---

export const DEFAULT_LANGUAGE = "en" as const;

// Supported content languages: single source for WebSite.inLanguage and Person.knowsLanguage
export const SITE_LANGUAGES = ["en", "pl"] as const;

// Keyed by language rather than laid out parallel to SITE_LANGUAGES, so adding a locale is a
// "missing key" type error here instead of a silent positional mismatch
export const SITE_LANGUAGE_NAMES = { en: "English", pl: "Polish" } as const satisfies Readonly<
  Record<PreferredLanguage, string>
>;

// Open Graph uses underscored locale identifiers, not the plain language codes above
export const OPEN_GRAPH_LOCALES = { en: "en_US", pl: "pl_PL" } as const satisfies Record<PreferredLanguage, string>;

// --- JSON-LD node ids ---

// Stable @graph node ids: page-level structured data references these entities
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/#person`;
export const PUBLISHER_ID = `${SITE_URL}/#publisher`;
export const PROFILE_ID = `${SITE_URL}/#profile`;

// --- Machine-readable discovery documents (GEO) ---

// Reuse permissions, written once and mirrored between robots.txt and the response headers of
// every machine-readable document, so a crawler that reads only the HTTP layer still learns the
// same policy
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

// llms.txt is advertised via <link rel="alternate"> in every head; the full-content companion and
// the XML sitemap are linked from llms.txt
export const LLMS_TXT_HREF = "/llms.txt";
export const LLMS_FULL_TXT_HREF = "/llms-full.txt";
export const SITEMAP_HREF = "/sitemap.xml";
export const ROBOTS_TXT_HREF = "/robots.txt";
export const HOME_MD_HREF = "/index.md";
export const EDUCATION_MD_HREF = "/education.md";
export const CONTACT_MD_HREF = "/contact.md";

// Downloadable documents advertised to AI systems in education twins and llms.txt. These are the
// only binary artifacts the site exposes to crawlers; everything else is HTML or Markdown text.
export const CV_EN_HREF = "/my-cv.pdf";
export const CV_PL_HREF = "/my-cv-pl.pdf";
export const CERTIFICATES_HREF = "/my-certificates.pdf";

// --- HTTP responses ---

// One CDN cache policy shared by every machine-readable document (.md twins, llms.txt, robots.txt, sitemap.xml)
export const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";

// The request headers a language-negotiated document actually depends on: the locale cookie GT
// writes on every response, and the Accept-Language a cookie-less crawler sends instead. Declared
// beside the other shared response directives because the HTML document and the Markdown twins
// negotiate the same two inputs off the same URL, so a cache cannot key one and not the other.
export const LANGUAGE_VARY = "Cookie, Accept-Language";

// Failure responses (404 twins, 503 fallbacks): incomplete content must never be cached as if it
// were complete, and must stay out of search results.
export const NO_STORE = "no-store";
export const NOINDEX_FOLLOW = "noindex, follow";

// Complete-data pages opt into indexing with this directive: max-snippet:-1 leaves AI overviews
// and citation surfaces unconstrained. max-video-preview:-1 matters here because experience twins
// carry `videoLink`s: without it Google caps the video snippet at zero and drops the page out of
// AI video previews entirely.
export const INDEXABLE_ROBOTS = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

// Crawl pacing for AI training and data-set crawlers: one request per 10 seconds keeps crawler
// budgets predictable without blocking indexing bots.
export const CRAWL_DELAY = "10";

// Plain-text content type shared by every non-Markdown discovery document (robots.txt, llms.txt, llms-full.txt)
export const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";

// Sitemap content type
export const XML_CONTENT_TYPE = "application/xml; charset=utf-8";

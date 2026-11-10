// Everything the site advertises to crawlers and AI fetchers: the reuse signal, the discovery
// document hrefs (robots, sitemap, llms indexes, downloadable documents), and the `<link>` and
// `Link:` header projections built from them.

// services, features, and other libraries
import { matchPreferredLanguage } from "@/domain/helpers";
import { joinLinkHeader } from "./link-tags";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LinkTag } from "./models";

// constants
import { SOCIAL_LINKS, SITE_URL } from "./site";

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

export const cvPdfHref = (preferredLanguage: PreferredLanguage) => matchPreferredLanguage(preferredLanguage, CV_EN_HREF, CV_PL_HREF);

// Discovery indexes projected into <head> and Link headers
export const LLMS_TXT_INDEX = { name: "llms.txt", url: `${SITE_URL}${LLMS_TXT_HREF}` } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", url: `${SITE_URL}${LLMS_FULL_TXT_HREF}` } as const;
export const AI_INDEXES = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;

export const SITEMAP_LINK = { rel: "sitemap", href: `${SITE_URL}${SITEMAP_HREF}` } as const;
export const LLMS_DISCOVERY_LINK: LinkTag = { rel: "llms", href: LLMS_TXT_INDEX.url };

export const AI_INDEX_LINKS: ReadonlyArray<LinkTag> = AI_INDEXES.map(({ name, url }) => ({ rel: "alternate", type: "text/plain", title: name, href: url }));
export const AI_INDEX_LINK_HEADER = joinLinkHeader(AI_INDEX_LINKS);

export const ME_LINKS: ReadonlyArray<LinkTag> = SOCIAL_LINKS.map((href) => ({ rel: "me", href }));

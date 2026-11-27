// Everything the site advertises to crawlers and AI fetchers: the reuse signal, the discovery
// document hrefs (robots, sitemap, llms indexes, downloadable documents), and the `<link>` and
// `Link:` header projections built from them.

// services, features, and other libraries
import { Array } from "effect";
import { msg } from "gt-i18n";
import { matchPreferredLanguage } from "@/domain/helpers";
import { joinLinkHeader } from "./link-tags";
import { absoluteUrl } from "@/domain/urls";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LinkTag } from "./models";

// constants
import { SOCIAL_LINKS } from "@/domain/site";

// Content signal defining crawler permissions across robots.txt and HTTP headers
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

const LLMS_TXT_HREF = "/llms.txt";
const LLMS_FULL_TXT_HREF = "/llms-full.txt";
const SITEMAP_HREF = "/sitemap.xml";
const ROBOTS_TXT_HREF = "/robots.txt";

const CV_EN_HREF = "/my-cv.pdf";
const CV_PL_HREF = "/my-cv-pl.pdf";
export const CERTIFICATES_HREF = "/my-certificates.pdf";

export const DOWNLOADABLE_DOCUMENTS = [
  { label: msg("CV (English)"), href: CV_EN_HREF },
  { label: msg("CV (Polish)"), href: CV_PL_HREF },
  { label: msg("Certificates"), href: CERTIFICATES_HREF },
] as const;

export const DOWNLOADABLE_DOCUMENT_PATHS = Array.map(DOWNLOADABLE_DOCUMENTS, ({ href }) => href);

export const cvPdfHref = (preferredLanguage: PreferredLanguage) => matchPreferredLanguage(preferredLanguage, CV_EN_HREF, CV_PL_HREF);

// One crawl catalogue feeds HTML links, HTTP headers, robots.txt and the Markdown discovery lists
export const LLMS_TXT_INDEX = { name: "llms.txt", summary: "this index", url: absoluteUrl(LLMS_TXT_HREF) } as const;
export const LLMS_FULL_TXT_INDEX = { name: "llms-full.txt", summary: "the complete site in one document", url: absoluteUrl(LLMS_FULL_TXT_HREF) } as const;
export const ROBOTS_TXT_INDEX = { name: "robots.txt", summary: "crawl directives", url: absoluteUrl(ROBOTS_TXT_HREF) } as const;
export const SITEMAP_INDEX = { name: "sitemap.xml", summary: "sitemap", url: absoluteUrl(SITEMAP_HREF) } as const;
export const AI_INDEXES = [LLMS_TXT_INDEX, LLMS_FULL_TXT_INDEX] as const;
export const DISCOVERY_DOCUMENTS = [...AI_INDEXES, ROBOTS_TXT_INDEX, SITEMAP_INDEX] as const;

export const SITEMAP_LINK = { rel: "sitemap", href: SITEMAP_INDEX.url } as const;
// llms.txt reserves `describedby` for its index and `alternate` for a page's own Markdown twin.
export const LLMS_DISCOVERY_LINK: LinkTag = { rel: "describedby", href: LLMS_TXT_INDEX.url };
export const LLMS_FULL_DISCOVERY_LINK: LinkTag = { rel: "related", type: "text/plain", title: LLMS_FULL_TXT_INDEX.name, href: LLMS_FULL_TXT_INDEX.url };
export const AI_DISCOVERY_LINKS: ReadonlyArray<LinkTag> = [LLMS_DISCOVERY_LINK, LLMS_FULL_DISCOVERY_LINK];
// Discovery documents name other crawl surfaces, never a redundant reference to themselves
export const aiDiscoveryLinkHeader = (selfUrl?: string) => joinLinkHeader(Array.filter(AI_DISCOVERY_LINKS, ({ href }) => href !== selfUrl));
export const AI_DISCOVERY_LINK_HEADER = aiDiscoveryLinkHeader();

export const ME_LINKS: ReadonlyArray<LinkTag> = Array.map(SOCIAL_LINKS, (href) => ({ rel: "me", href }));

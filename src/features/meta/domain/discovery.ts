// The crawler-facing document surface this site publishes: the machine-readable discovery files,
// the reusable content policy every one of them repeats, and the downloadable documents the
// sitemap and the Markdown pages advertise. Declared in one module so no surface has to restate a
// path, and so the policy that governs these documents lives beside the documents themselves.
// The generated bodies live beside their own builders (./sitemap, ./robots).

// services, features, and other libraries
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";

// --- Machine-readable discovery documents (GEO) ---

// Content signal defining crawler permissions across robots.txt and HTTP headers.
export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";

export const LLMS_TXT_HREF = "/llms.txt";
export const LLMS_FULL_TXT_HREF = "/llms-full.txt";
export const SITEMAP_HREF = "/sitemap.xml";
export const ROBOTS_TXT_HREF = "/robots.txt";

// --- Downloadable documents ---

// Downloadable document links exposed to crawlers.
export const CV_EN_HREF = "/my-cv.pdf";
export const CV_PL_HREF = "/my-cv-pl.pdf";
export const CERTIFICATES_HREF = "/my-certificates.pdf";

// Resolves the visitor's own CV file; both languages are advertised site-wide, but the header
// nav offers the one that matches the reader.
export const cvPdfHref = (preferredLanguage: PreferredLanguage) => matchPreferredLanguage(preferredLanguage, CV_EN_HREF, CV_PL_HREF);

// Downloadable files advertised by Markdown pages, discovery indexes and the sitemap.
export const DOWNLOADABLE_DOCUMENTS = [
  { label: "CV (English)", href: CV_EN_HREF },
  { label: "CV (Polish)", href: CV_PL_HREF },
  { label: "Certificates", href: CERTIFICATES_HREF },
] as const;

// The download paths alone, for the sitemap that lists every addressable document by URL.
export const DOWNLOADABLE_DOCUMENT_PATHS = DOWNLOADABLE_DOCUMENTS.map(({ href }) => href);

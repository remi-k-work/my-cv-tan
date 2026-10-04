// services, features, and other libraries
import { Array, pipe } from "effect";

// constants
import { LLMS_TXT_HREF, SITE_URL } from "./constants";

// Canonical absolute URL for a site path
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// Self-referencing hreflang entries; one URL serves both languages (cookie-based), so every locale variant points back at the same canonical URL
export const hreflangLinks = (path: string) =>
  pipe(
    ["en", "pl", "x-default"] as const,
    Array.map((locale) => ({ rel: "alternate", hrefLang: locale, href: absoluteUrl(path) }) as const)
  );

export const canonicalLink = (path: string) => ({ rel: "canonical", href: absoluteUrl(path) }) as const;
export const jsonLdScript = (data: unknown) => ({ type: "application/ld+json", children: JSON.stringify(data) }) as const;

// Machine-readable alternate for a page: points crawlers and AI fetchers at the Markdown twin
export const markdownAlternateLink = (mdHref: string) => ({ rel: "alternate", type: "text/markdown", href: absoluteUrl(mdHref) }) as const;

// llms.txt discovery link, emitted on every page head for GEO crawlers
export const llmsAlternateLink = () => ({ rel: "alternate", type: "text/plain", title: "llms.txt", href: absoluteUrl(LLMS_TXT_HREF) }) as const;

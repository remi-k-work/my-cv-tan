// services, features, and other libraries
import { Option, String, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain";

// types
import type { PreferredLanguage } from "@/domain";

// constants
import { CV_EN_HREF, CV_PL_HREF, LLMS_TXT_HREF, SITE_URL } from "./constants";

// --- URL building ---

// Canonical absolute URL for a site path
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// CV download for the visitor's language; the English CV is the source-language document
export const cvPdfHref = (preferredLanguage: PreferredLanguage) => matchPreferredLanguage(preferredLanguage, CV_EN_HREF, CV_PL_HREF);

// Parens are legal in URLs but break bare Markdown destinations; shared with the markdown feature
export const encodeParens = (value: string) => value.replace(/[()]/g, (character) => encodeURIComponent(character));

export const experiencePath = (slug: string) => `/${encodeParens(encodeURIComponent(slug))}`;
export const experienceMarkdownPath = (slug: string) => `${experiencePath(slug)}.md`;
export const experienceMarkdownHref = (slug: string) => absoluteUrl(experienceMarkdownPath(slug));

// Share-image URL for an experience; a blank imageName yields None so callers fall back to the global jpeg
export const experienceImageUrl = (imageName: string) =>
  pipe(
    Option.fromNullishOr(imageName),
    Option.filter((name) => String.isNonEmpty(String.trim(name))),
    // Keep content-provided image keys inside the intended URL path segment
    Option.map((name) => absoluteUrl(`/images/${encodeURIComponent(name.trim())}-a.webp`))
  );

// --- <link> tag builders ---

// Canonical <link> for a page, from an already-resolved absolute URL: stray query
// parameters must never become duplicate documents
export const canonicalLink = (href: string) => ({ rel: "canonical", href }) as const;

// Machine-readable alternate for a page: points crawlers and AI fetchers at the Markdown twin
export const markdownAlternateLink = (mdPath: string) => ({ rel: "alternate", type: "text/markdown", href: absoluteUrl(mdPath) }) as const;

// llms.txt discovery link, emitted on every page head for GEO crawlers
export const llmsAlternateLink = () => ({ rel: "alternate", type: "text/plain", title: "llms.txt", href: absoluteUrl(LLMS_TXT_HREF) }) as const;

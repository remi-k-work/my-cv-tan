// services, features, and other libraries
import { Option, Schema, String, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";

// constants
import { CV_EN_HREF, CV_PL_HREF, LLMS_FULL_TXT_HREF, LLMS_TXT_HREF, SITE_URL } from "./constants";

// --- URL building ---

// Shared by every boundary that receives untrusted URLs (request URLs, content-provided
// links): takes unknown and decodes to None, so a value the parser rejects is data, not a throw
// Built once at module scope so each call reuses the same parser
export const decodeUrlOption = Schema.decodeUnknownOption(Schema.URLFromString);

// Canonical absolute URL for a site path
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// Stable, language-pinned variant of a negotiated URL. The Markdown endpoints support
// ?lang=, so crawlers can fetch each language without relying on cookies or headers
// Decoded with Schema because a non-absolute URL is a bad canonical, not a crash: a value
// the URL parser rejects is passed through untouched rather than throwing a TypeError
// inside a Link/Content-Location header build
export const withLanguageParam = (url: string, preferredLanguage: PreferredLanguage) =>
  pipe(
    decodeUrlOption(url),
    Option.map((variant) => {
      variant.searchParams.set("lang", preferredLanguage);
      return variant.href;
    }),
    Option.getOrElse(() => url)
  );

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
    Option.map(String.trim),
    Option.filter(String.isNonEmpty),
    // Keep content-provided image keys inside the intended URL path segment
    Option.map((name) => absoluteUrl(`/images/${encodeURIComponent(name)}-a.webp`))
  );

// --- <link> tag builders ---

// Canonical <link> for a page, from an already-resolved absolute URL: stray query
// parameters must never become duplicate documents
export const canonicalLink = (href: string) => ({ rel: "canonical", href }) as const;

// Machine-readable alternate for a page: points crawlers and AI fetchers at the Markdown twin
export const markdownAlternateLink = (mdPath: string) => ({ rel: "alternate", type: "text/markdown", href: absoluteUrl(mdPath) }) as const;

// llms.txt discovery link, emitted on every page head for GEO crawlers
export const llmsAlternateLink = () => ({ rel: "alternate", type: "text/plain", title: "llms.txt", href: absoluteUrl(LLMS_TXT_HREF) }) as const;

// Full-content companion of llms.txt, advertised beside it so AI fetchers skip one discovery hop
export const llmsFullAlternateLink = () => ({ rel: "alternate", type: "text/plain", title: "llms-full.txt", href: absoluteUrl(LLMS_FULL_TXT_HREF) }) as const;

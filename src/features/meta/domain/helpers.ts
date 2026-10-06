// services, features, and other libraries
import { Option, pipe } from "effect";

// constants
import { LLMS_TXT_HREF, SITE_URL } from "./constants";

// Canonical absolute URL for a site path
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

export const canonicalLink = (path: string) => ({ rel: "canonical", href: absoluteUrl(path) }) as const;

// Serialized JSON lives inside a <script> tag; escaping "<" as "\u003C" stops
// content-sourced strings from breaking out of the tag while staying valid JSON
export const jsonLdScript = (data: unknown) => ({ type: "application/ld+json", children: JSON.stringify(data).replace(/</g, "\\u003C") }) as const;

// Machine-readable alternate for a page: points crawlers and AI fetchers at the Markdown twin
export const markdownAlternateLink = (mdHref: string) => ({ rel: "alternate", type: "text/markdown", href: absoluteUrl(mdHref) }) as const;

// llms.txt discovery link, emitted on every page head for GEO crawlers
export const llmsAlternateLink = () => ({ rel: "alternate", type: "text/plain", title: "llms.txt", href: absoluteUrl(LLMS_TXT_HREF) }) as const;

// Share-image URL for an experience; a blank imageName yields None so callers fall back to the global jpeg
export const experienceImageUrl = (imageName: string) =>
  pipe(
    Option.fromNullishOr(imageName),
    Option.filter((name) => name.trim().length > 0),
    Option.map((name) => absoluteUrl(`/images/${name}-a.webp`))
  );

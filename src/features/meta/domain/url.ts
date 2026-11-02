// --- URL math only ---
// This module owns how a URL is spelled and which path a slug becomes. Image resolution (which
// picture a card publishes) lives here too because it is a content decision that produces a URL:
// a screenshot that exists on disk but is never claimed on the page would be a structured-data lie.

// services, features, and other libraries
import { Option, Schema, String, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { SocialImageFacts } from "./social";

// constants
import { CV_EN_HREF, CV_PL_HREF, SITE_URL } from "./constants";

// Built once at module scope: every boundary that receives an untrusted URL decodes through the
// same parser, so a rejected value is data (None) rather than a throw.
export const decodeUrlOption = Schema.decodeUnknownOption(Schema.URLFromString);

// Canonical absolute URL for a site path
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// Stable, language-pinned variant of an already-absolute URL. The Markdown endpoints support
// ?lang=, so crawlers can fetch each language without relying on cookies or headers.
//
// searchParams.set replaces any existing lang, so repeated pinning stays idempotent. A value the
// parser rejects is passed through untouched, because a non-absolute URL is a bad canonical rather
// than a crash — it must never throw inside a header build.
export const withLanguageParam = (url: string, preferredLanguage: PreferredLanguage) =>
  pipe(
    decodeUrlOption(url),
    Option.map((variant) => {
      variant.searchParams.set("lang", preferredLanguage);
      return variant.href;
    }),
    Option.getOrElse(() => url)
  );

// The one spelling of a twin URL from its site-relative route: absolute first, then pinned to the
// language the document renders in.
//
// The <head> advertisement, the Link header's hreflang alternates, the AI-index entry, the
// Content-Location and the twins' own cross-links all resolve the twin through here, so those five
// surfaces byte-match instead of each re-deriving the pin from a bare href — which is how one of
// them drifts and a crawler fetches a variant the page never advertised.
export const markdownTwinUrl = (mdPath: string, preferredLanguage: PreferredLanguage) => withLanguageParam(absoluteUrl(mdPath), preferredLanguage);

// CV download for the visitor's language; the English CV is the source-language document
export const cvPdfHref = (preferredLanguage: PreferredLanguage) => matchPreferredLanguage(preferredLanguage, CV_EN_HREF, CV_PL_HREF);

// Parens are legal in URLs but break bare Markdown destinations; shared with the markdown feature
export const encodeParens = (value: string) => value.replace(/[()]/g, (character) => encodeURIComponent(character));

// The one place a slug becomes a path. Canonical, social, JSON-LD and .md URLs all derive from
// here, so the slug and its encoded form can never disagree.
export const experiencePath = (slug: string) => `/${encodeParens(encodeURIComponent(slug))}`;
export const experienceMarkdownPath = (slug: string) => `${experiencePath(slug)}.md`;

// --- Image resolution ---

// Which image an experience resolves to, as verified facts with no alt text. Split out of the pure
// URL helpers because it answers "does the page show a picture at all" while url.ts answers "how is
// an address spelled". Both consumers (og:image and JSON-LD image) resolve through here, so the
// social tags and structured data can never disagree about the picture.
//
// Returns verified facts without an alt text: the card alt is copy heads.ts writes per headline.
// A blank imageName also yields None, which is what lets callers fall back to the global jpeg
// banner without re-reading content.
export const experienceScreenshot = (imageName: string): Option.Option<SocialImageFacts> => {
  // A blank content name is "no screenshot", not a 404 link to a file that does not exist
  const name = String.trim(imageName);

  return String.isNonEmpty(name)
    ? Option.some({
        // Keep content-provided image keys inside the intended URL path segment
        src: absoluteUrl(`/images/${encodeURIComponent(name)}-a.webp`),
        mime: "image/webp",
        width: SCREENSHOT_WIDTH,
        height: SCREENSHOT_HEIGHT,
      })
    : Option.none();
};

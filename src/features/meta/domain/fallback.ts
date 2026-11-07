// The degraded document: the head a route falls back to when its own data is missing, stale or
// unknown, and the localized copy that head and the not-found page both print. Declared in one
// module because the two describe the same document — a crawler reads the head, a visitor reads the
// page — so a claim that drifted between them would tell the two readers different stories about
// one address.

// services, features, and other libraries
import { NOINDEX_FOLLOW } from "@/domain/http";

// domain
import { siteGraphScript } from "./graph";
import { canonicalLink } from "./link-tags";
import { absoluteUrl } from "./urls";

// constants
import { BRANDED_TITLE } from "./identity";
import { DEFAULT_LANGUAGE } from "./languages";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { PageHead } from "./models";

// --- The copy both surfaces publish ---

interface DegradedCopy {
  readonly title: string;
  readonly description: string;
}

// A route the site does not know has no page to name; a route it knows but cannot serve yet does.
// The head decides which document this is from that one fact, so the copy follows it.
export const NOT_FOUND_COPY: Readonly<Record<PreferredLanguage, DegradedCopy>> = {
  en: { title: "Not Found", description: "The requested page could not be found." },
  pl: { title: "Nie znaleziono", description: "Nie znaleziono żądanej strony." },
};

export const UNAVAILABLE_COPY: Readonly<Record<PreferredLanguage, DegradedCopy>> = {
  en: { title: "Page unavailable", description: "This page is temporarily unavailable." },
  pl: { title: "Strona niedostępna", description: "Ta strona jest tymczasowo niedostępna." },
};

const degradedCopy = (preferredLanguage: PreferredLanguage, notFound: boolean) => (notFound ? NOT_FOUND_COPY : UNAVAILABLE_COPY)[preferredLanguage];

// --- The head ---

// Fallback documents stay out of search results while identifying the failed route and language.
// A route the head has no path for is one the site does not know, which is exactly the not-found
// fallback, so the copy is decided by the same fact that decides the canonical.
export const fallbackHead = (pagePath: string | undefined, preferredLanguage: PreferredLanguage = DEFAULT_LANGUAGE): PageHead => {
  const notFound = pagePath === undefined;
  const { title, description } = degradedCopy(preferredLanguage, notFound);

  return {
    meta: [{ title: BRANDED_TITLE(title) }, { name: "robots", content: NOINDEX_FOLLOW }, { name: "description", content: description }],
    links: notFound ? [] : [canonicalLink(absoluteUrl(pagePath))],
    // The site entities still publish: a degraded document is still one about this site
    scripts: [siteGraphScript],
  };
};

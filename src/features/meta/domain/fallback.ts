// The degraded heads: a noindex document for a not-found (404) or temporarily unavailable (503)
// page that still publishes the site entities so a crawler is never handed a bare failure.

// services, features, and other libraries
import { absoluteUrl } from "./urls";
import { canonicalLink } from "./link-tags";
import { jsonLdGraph } from "./jsonld";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { PageHead } from "./models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { NOINDEX_FOLLOW } from "@/domain/http";
import { BRANDED_TITLE, NOT_FOUND_COPY, SITE_NODES, UNAVAILABLE_COPY } from "./site";

const degradedCopy = (preferredLanguage: PreferredLanguage, notFound: boolean) => (notFound ? NOT_FOUND_COPY : UNAVAILABLE_COPY)[preferredLanguage];

// Builds a noindex head for not-found (404) or data unavailable (503) states
export const fallbackHead = (pagePath: string | undefined, preferredLanguage: PreferredLanguage = DEFAULT_LANGUAGE): PageHead => {
  const notFound = pagePath === undefined;
  const { title, description } = degradedCopy(preferredLanguage, notFound);

  return {
    meta: [{ title: BRANDED_TITLE(title) }, { name: "robots", content: NOINDEX_FOLLOW }, { name: "description", content: description }],
    links: notFound ? [] : [canonicalLink(absoluteUrl(pagePath))],
    scripts: [jsonLdGraph(SITE_NODES)],
  };
};

// The degraded heads: a noindex document for a not-found (404) or temporarily unavailable (503)
// page that still publishes the site entities so a crawler is never handed a bare failure.

// services, features, and other libraries
import { absoluteUrl } from "@/domain/urls";
import { canonicalLink } from "./link-tags";
import { jsonLdGraph } from "./jsonld";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { LinkTag, PageHead } from "./models";

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { NOINDEX_FOLLOW } from "@/domain/http";
import { BRANDED_TITLE, NOT_FOUND_COPY, UNAVAILABLE_COPY } from "@/domain/site";
import { SITE_NODES } from "./site-nodes";

// The shared noindex envelope both degraded states publish; they differ only in their localized
// copy and in whether they name a route. Each state is its own named constructor so the compiler
// forces the distinction: the not-found head cannot be handed a path, and the unavailable head
// cannot omit one — a mistake the single `pagePath: string | undefined` parameter used to allow.
const degradedHead = (title: string, description: string, links: Array<LinkTag>): PageHead => ({
  meta: [{ title: BRANDED_TITLE(title) }, { name: "robots", content: NOINDEX_FOLLOW }, { name: "description", content: description }],
  links,
  scripts: [jsonLdGraph(SITE_NODES)],
});

// A data-unavailable (503) document for a route that is still named: it keeps that route's canonical
export const unavailableHead = (pagePath: string, preferredLanguage: PreferredLanguage = DEFAULT_LANGUAGE): PageHead => {
  const { title, description } = UNAVAILABLE_COPY[preferredLanguage];
  return degradedHead(title, description, [canonicalLink(absoluteUrl(pagePath))]);
};

// A not-found (404) document with no route to name: it publishes no canonical
export const notFoundHead = (preferredLanguage: PreferredLanguage = DEFAULT_LANGUAGE): PageHead => {
  const { title, description } = NOT_FOUND_COPY[preferredLanguage];
  return degradedHead(title, description, []);
};

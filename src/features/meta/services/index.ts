// Public surface of the meta service layer: response headers and discovery
// document handlers. Re-exported through one barrel so consumers import from
// a single path instead of reaching into individual service modules.

export { LANGUAGE_VARY, MACHINE_HEADERS, CACHEABLE_HEADERS, NOINDEX_HEADERS, UNAVAILABLE_HEADERS, INDEXABLE_HEADERS, documentHeaders } from "./headers";

export { txtResponse, txtUnavailableResponse, discoveryTxtResponse, sitemapResponse, sitemapUnavailableResponse, robotsHandler, sitemapHandler } from "./http";

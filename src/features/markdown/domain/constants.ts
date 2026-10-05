// constants
export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";
export const MARKDOWN_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
export const MARKDOWN_VARY = "Cookie, Accept-Language";

// Frontmatter delimiters for every .md document (frontmatter mirrors <head> meta for AI indexers)
export const FRONTMATTER_DELIMITER = "---";

// constants
export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const MARKDOWN_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
export const MARKDOWN_VARY = "Cookie, Accept-Language";

// Frontmatter keys emitted on every .md document (mirrors <head> meta for AI indexers)
export const FRONTMATTER_DELIMITER = "---";

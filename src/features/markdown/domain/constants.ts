// constants
export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const MARKDOWN_VARY = "Cookie, Accept-Language";

// List lines (llms.txt, home twin) stay scannable: tighter than the 160-char meta description cap
export const LIST_EXCERPT_LENGTH = 140;

// Frontmatter delimiters for every .md document (frontmatter mirrors <head> meta for AI indexers)
export const FRONTMATTER_DELIMITER = "---";

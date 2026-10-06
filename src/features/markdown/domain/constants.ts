// constants
export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
export const TXT_CONTENT_TYPE = "text/plain; charset=utf-8";
export const MARKDOWN_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
export const MARKDOWN_VARY = "Cookie, Accept-Language";

// Downloadable documents advertised to AI systems in education twins and llms.txt
export const CV_EN_HREF = "/my-cv.pdf";
export const CV_PL_HREF = "/my-cv-pl.pdf";
export const CERTIFICATES_HREF = "/my-certificates.pdf";

// Frontmatter delimiters for every .md document (frontmatter mirrors <head> meta for AI indexers)
export const FRONTMATTER_DELIMITER = "---";

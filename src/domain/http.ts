// Shared HTTP directive values used by HTML, Markdown, and discovery responses
export const NO_STORE = "no-store";

// Locale- and cookie-negotiated HTML must revalidate privately instead of relying on heuristic shared caching
export const NEGOTIATED_DOCUMENT_CACHE = "private, no-cache";
export const NOINDEX_FOLLOW = "noindex, follow";

// How long a crawler should wait before retrying a temporarily unavailable resource; a failure is
// never cached, so a retry is the only way a fetcher can recover; naming a short delay keeps it from
// hammering the origin while still returning promptly if the data-layer outage was momentary
export const RETRY_AFTER = "300";

// Robots directive permitting full snippets and large previews for indexable pages
export const INDEXABLE_ROBOTS = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

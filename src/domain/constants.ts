// constants
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const SITE_LANGUAGES = ["en", "pl"] as const;

// The site's three static page routes, declared beside the languages and the schema that resolves
// them. Every surface addresses the same page by one of these, so a route added here is a route the
// page catalogue, the sitemap and the twins all pick up; the catalogue itself owns the ordered list.
export const HOME_PATH = "/" as const;
export const EDUCATION_PATH = "/education" as const;
export const CONTACT_PATH = "/contact" as const;

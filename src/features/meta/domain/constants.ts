// constants
export const SITE_URL = "https://www.remiforge.dev";
export const SITE_NAME = "Remi Forge";

export const TITLE = "Curious Web Dev: Eager to Learn, Collaborate, and Make a Splash";
export const DESCRIPTION =
  "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.";

export const GLOBAL_IMAGE = `${SITE_URL}/opengraph-image.jpg`;
export const AVATAR_IMAGE = `${SITE_URL}/avatar.jpg`;

// Global share image: jpeg with known dimensions
export const GLOBAL_SOCIAL_IMAGE = { src: GLOBAL_IMAGE, mime: "image/jpeg", width: 1200, height: 630 } as const;

// Google truncates meta descriptions around 150-160 chars; longer text never displays
export const META_DESCRIPTION_LENGTH = 160;

export const SOCIAL_LINKS = ["https://github.com/remi-k-work", "https://linkedin.com/in/remi-k-work"] as const;

export const HOME_LOCALITY = "Rzeszów";
export const HOME_COUNTRY = "PL";

// Stable JSON-LD @graph node ids: page-level structured data references these entities
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/#person`;
export const PUBLISHER_ID = `${SITE_URL}/#publisher`;

// Machine-readable discovery documents (GEO): advertised via <link rel="alternate"> in every head
export const LLMS_TXT_HREF = "/llms.txt";
export const HOME_MD_HREF = "/index.md";
export const EDUCATION_MD_HREF = "/education.md";
export const CONTACT_MD_HREF = "/contact.md";
export const EXPERIENCE_MD_HREF = (slug: string) => `/${slug}.md`;

// Base keyword set for the site; experience pages extend it with their own skillsUsed
export const BASE_KEYWORDS = ["web developer", "TypeScript", "React", "portfolio", "Remi Forge"] as const;

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const YEAR_ONLY = /^\d{4}$/;
export const MONTH_YEAR = /^([A-Z][a-z]{2}) (\d{4})$/;

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

// Human-readable country for AI-facing prose; JSON-LD keeps the ISO code above
export const HOME_COUNTRY_NAME = "Poland";

// Author identity facts: one source for JSON-LD (Person) and the llms.txt key facts
export const JOB_TITLE = "Web Developer";
export const KNOWS_ABOUT = ["Web Development", "TypeScript", "React", "Next.js", "Effect", "Front-End Development", "Full-Stack Development"] as const;

// Stable JSON-LD @graph node ids: page-level structured data references these entities
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/#person`;
export const PUBLISHER_ID = `${SITE_URL}/#publisher`;
export const PROFILE_ID = `${SITE_URL}/#profile`;

// Machine-readable discovery documents (GEO): advertised via <link rel="alternate"> in every head
export const LLMS_TXT_HREF = "/llms.txt";
export const HOME_MD_HREF = "/index.md";
export const EDUCATION_MD_HREF = "/education.md";
export const CONTACT_MD_HREF = "/contact.md";

// Downloadable documents advertised to AI systems in education twins and llms.txt
export const CV_EN_HREF = "/my-cv.pdf";
export const CV_PL_HREF = "/my-cv-pl.pdf";
export const CERTIFICATES_HREF = "/my-certificates.pdf";

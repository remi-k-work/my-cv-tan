// types
import type { ClassAttributes, DetailedHTMLProps, LinkHTMLAttributes, MetaHTMLAttributes } from "react";

export interface DocumentHead {
  meta?: (DetailedHTMLProps<MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement> | undefined)[];
  links?: ((ClassAttributes<HTMLLinkElement> & LinkHTMLAttributes<HTMLLinkElement>) | undefined)[];
  scripts?: ({ type: string; children: string } | undefined)[];
}

// constants
export const SITE_URL = "https://www.remiforge.dev";
export const SITE_NAME = "Remi Forge";

export const TITLE = "Curious Web Dev: Eager to Learn, Collaborate, and Make a Splash";
export const DESCRIPTION =
  "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.";

export const GLOBAL_IMAGE = `${SITE_URL}/opengraph-image.jpg`;
export const AVATAR_IMAGE = `${SITE_URL}/avatar.jpg`;

// Verified from the VP8 headers: every /images/{name}-a.webp screenshot is 1600x900
export const SCREENSHOT_WIDTH = 1600;
export const SCREENSHOT_HEIGHT = 900;

// Google truncates meta descriptions around 150-160 chars; longer text never displays
export const META_DESCRIPTION_LENGTH = 160;

export const SOCIAL_LINKS = ["https://github.com/remi-k-work", "https://linkedin.com/in/remi-k-work"] as const;

export const HOME_LOCALITY = "Rzeszów";
export const HOME_COUNTRY = "PL";

// Machine-readable discovery documents (GEO): advertised via <link rel="alternate"> in every head
export const LLMS_TXT_HREF = "/llms.txt";
export const HOME_MD_HREF = "/index.md";
export const EDUCATION_MD_HREF = "/education.md";
export const CONTACT_MD_HREF = "/contact.md";
export const experienceMdHref = (slug: string) => `/${slug}.md`;

// Base keyword set for the site; experience pages extend it with their own skillsUsed
export const BASE_KEYWORDS = ["web developer", "TypeScript", "React", "portfolio", "Remi Forge"] as const;

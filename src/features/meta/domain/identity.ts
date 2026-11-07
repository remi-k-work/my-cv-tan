// Who this site is and what it publishes itself as: the canonical origin, the brand's own copy,
// the author identity every schema.org Person restates, and the verified images the social cards
// and the graph share. Declared once so the HTML heads, the JSON-LD entities, the Markdown twins
// and the AI indexes cannot each spell the site a second way.

// --- Canonical origin ---
export const SITE_URL = "https://www.remiforge.dev";

// Authoritative homepage, author profile, and publisher URLs.
export const HOME_URL = `${SITE_URL}/`;
export const AUTHOR_URL = HOME_URL;
export const PUBLISHER_URL = HOME_URL;

// --- Brand copy ---

export const SITE_NAME = "Remi Forge";
export const HOME_TITLE = "Web Developer in Rzeszów, Poland";

// Rich biography for schema.org Person and AI prose.
export const PERSON_DESCRIPTION =
  "Passionate, self-taught web developer with a strong drive for continuous learning and a proven track record of delivering results. Eager to contribute to impactful projects, collaborate with experienced teams, and build high-quality web applications.";

// Concise search summary for metadata.
export const SITE_DESCRIPTION =
  "Remi Forge is a web developer in Rzeszów, Poland, building modern web applications with React, TypeScript, and full-stack tools.";

// Upper bound for search engine snippet lengths.
export const META_DESCRIPTION_LENGTH = 160;

// Document title template shared by HTML heads and Markdown frontmatter.
export const BRANDED_TITLE = (title: string) => `${SITE_NAME} ● ${title}`;

// --- Author identity ---

export const JOB_TITLE = "Web Developer";
export const KNOWS_ABOUT = ["Web Development", "TypeScript", "React", "Next.js", "Effect", "Front-End Development", "Full-Stack Development"] as const;

// Social profiles declared once for JSON-LD sameAs, rel="me", the header nav and Markdown twins.
export const SOCIAL_PROFILES = [
  { name: "GitHub", href: "https://github.com/remi-k-work" },
  { name: "LinkedIn", href: "https://linkedin.com/in/remi-k-work" },
] as const;

export const SOCIAL_LINKS = SOCIAL_PROFILES.map(({ href }) => href);

export const HOME_LOCALITY = "Rzeszów";
export const HOME_COUNTRY = "PL";
export const HOME_COUNTRY_NAME = "Poland";

// Where the author is based, as one sentence. The Markdown twins translate it as a dictionary key
// and the AI indexes state it as a fact, so the two spell it from this one string.
export const HOME_LOCATION = `${HOME_LOCALITY}, ${HOME_COUNTRY_NAME}`;

// --- Images ---

// Verified facts about a published image file. Every card image the site publishes is declared
// against this contract, so a wrong mime or swapped dimensions becomes a compile error rather
// than a silently broken card.
export interface SocialImageFacts {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

// Standard 1200x630 Open Graph share image; alt text is resolved with each page's language.
export const GLOBAL_SOCIAL_IMAGE: SocialImageFacts = {
  src: `${SITE_URL}/opengraph-image.jpg`,
  mime: "image/jpeg",
  width: 1200,
  height: 630,
};

// Square headshot satisfying schema.org logo and avatar requirements; it is a logo rather than a
// card image, so it declares no mime.
export const AVATAR: Omit<SocialImageFacts, "mime"> = { src: `${SITE_URL}/avatar.jpg`, width: 288, height: 288 };

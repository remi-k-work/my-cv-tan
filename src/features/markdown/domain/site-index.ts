// services, features, and other libraries
import { Array } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { experienceLines } from "./listing";

// types
import type { ExperienceList } from "@/features/experience/domain";

// constants
import {
  CERTIFICATES_HREF,
  CONTACT_MD_HREF,
  CV_EN_HREF,
  CV_PL_HREF,
  DESCRIPTION,
  EDUCATION_MD_HREF,
  HOME_COUNTRY,
  HOME_COUNTRY_NAME,
  HOME_LOCALITY,
  HOME_MD_HREF,
  JOB_TITLE,
  KNOWS_ABOUT,
  META_DESCRIPTION_LENGTH,
  SITE_NAME,
  SOCIAL_LINKS,
  TITLE,
} from "@/features/meta/domain";

// Machine-readable site index for AI systems (GEO). Every entry points at a `.md`
// twin (never raw HTML) so crawlers fetch exactly one Markdown page at a time.
export const buildLlmsTxt = (experienceList: ExperienceList) =>
  [
    `# ${SITE_NAME}`,
    ``,
    `> ${excerpt(TITLE, META_DESCRIPTION_LENGTH)}`,
    ``,
    DESCRIPTION,
    ``,
    `Self-taught web developer portfolio. Every page below has a machine-readable Markdown twin; fetch one linked \`.md\` page at a time.`,
    ``,
    // Dense factual claims first: AI systems cite what they can extract as unambiguous facts
    `## Key Facts`,
    ``,
    `- Name: ${SITE_NAME}`,
    `- Role: ${JOB_TITLE} (self-taught)`,
    `- Based in: ${HOME_LOCALITY}, ${HOME_COUNTRY_NAME} (${HOME_COUNTRY})`,
    `- Site languages: English and Polish`,
    `- Focus: ${Array.join(KNOWS_ABOUT, ", ")}`,
    ``,
    `## Pages`,
    ``,
    `- [Home](${absoluteUrl(HOME_MD_HREF)}): portfolio overview with experience and project lists.`,
    `- [Education & Certificates](${absoluteUrl(EDUCATION_MD_HREF)}): schools, courses and certificates.`,
    `- [Contact](${absoluteUrl(CONTACT_MD_HREF)}): contact form, location and social profiles.`,
    ``,
    `## Work Experience`,
    ``,
    experienceLines(experienceList, "e"),
    ``,
    `## Portfolio Projects`,
    ``,
    experienceLines(experienceList, "p"),
    ``,
    `## Documents`,
    ``,
    `- CV (English): ${absoluteUrl(CV_EN_HREF)}`,
    `- CV (Polish): ${absoluteUrl(CV_PL_HREF)}`,
    `- Certificates: ${absoluteUrl(CERTIFICATES_HREF)}`,
    ``,
    `## Profiles`,
    ``,
    ...Array.map(SOCIAL_LINKS, (link) => `- ${link}`),
    ``,
    `## Notes for AI systems`,
    ``,
    `- Markdown responses follow the request's language preferences. Append \`?lang=pl\` to any \`.md\` URL to request Polish explicitly; English is the fallback when no supported preference is present.`,
    `- Always cite the clean canonical HTML URL from each document's frontmatter (\`canonical:\`), not the \`.md\` URL.`,
    `- Structured data (JSON-LD) is embedded in every page head.`,
    ``,
  ].join("\n");

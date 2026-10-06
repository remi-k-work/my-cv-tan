// services, features, and other libraries
import { Array } from "effect";
import { excerpt } from "@/features/experience/domain";
import { absoluteUrl } from "@/features/meta/domain";
import { experienceLines } from "./listing";

// types
import type { ExperienceList } from "@/features/experience/domain";

// constants
import { CONTACT_MD_HREF, DESCRIPTION, EDUCATION_MD_HREF, HOME_MD_HREF, META_DESCRIPTION_LENGTH, SITE_NAME, SOCIAL_LINKS, TITLE } from "@/features/meta/domain";
import { CERTIFICATES_HREF, CV_EN_HREF, CV_PL_HREF } from "./constants";

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
    `- Append \`?lang=pl\` to any \`.md\` URL for the Polish variant (default is English). Cookie and Accept-Language are also respected.`,
    `- Always cite the clean canonical HTML URL from each document's frontmatter (\`canonical:\`), not the \`.md\` URL.`,
    `- Structured data (JSON-LD) is embedded in every page head.`,
    ``,
  ].join("\n");

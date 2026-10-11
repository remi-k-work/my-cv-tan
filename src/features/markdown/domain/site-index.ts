// services, features, and other libraries
import { Array } from "effect";
import { absoluteUrl, experiencePath } from "@/features/meta/domain";
import { buildExperienceMd } from "./experience";
import { translateSource } from "./helpers";
import { experienceLines } from "./listing";
import { buildContactMd, buildEducationMd, buildHomeMd } from "./pages";

// types
import type { ExperienceList } from "@/features/experience/domain";
import type { LlmsFullInput } from "./models";

// constants
import {
  CERTIFICATES_HREF,
  CONTACT_MD_HREF,
  CV_EN_HREF,
  CV_PL_HREF,
  PERSON_DESCRIPTION,
  EDUCATION_MD_HREF,
  HOME_COUNTRY,
  HOME_COUNTRY_NAME,
  HOME_LOCALITY,
  HOME_MD_HREF,
  JOB_TITLE,
  KNOWS_ABOUT,
  LLMS_FULL_TXT_HREF,
  SITEMAP_HREF,
  SITE_LANGUAGE_NAMES,
  SITE_NAME,
  SOCIAL_LINKS,
  HOME_TITLE,
} from "@/features/meta/domain";

// Shared header of both AI indexes: site name, one-line value proposition, and full intro
const siteHeader = (summary: string) => [`# ${SITE_NAME}`, ``, `> ${HOME_TITLE}`, ``, PERSON_DESCRIPTION, ``, summary, ``];

// Machine-readable site index for AI systems (GEO). Every entry points at a `.md`
// twin (never raw HTML) so crawlers fetch exactly one Markdown page at a time.
export const buildLlmsTxt = (experienceList: ExperienceList) =>
  [
    ...siteHeader("Self-taught web developer portfolio. Every page below has a machine-readable Markdown twin; fetch one linked `.md` page at a time."),
    // Dense factual claims first: AI systems cite what they can extract as unambiguous facts
    `## Key Facts`,
    ``,
    `- Name: ${SITE_NAME}`,
    `- Role: ${JOB_TITLE} (self-taught)`,
    `- Based in: ${HOME_LOCALITY}, ${HOME_COUNTRY_NAME} (${HOME_COUNTRY})`,
    `- Site languages: ${Array.join(SITE_LANGUAGE_NAMES, " and ")}`,
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
    experienceLines({ experienceList, type: "e" }),
    ``,
    `## Portfolio Projects`,
    ``,
    experienceLines({ experienceList, type: "p" }),
    ``,
    `## Documents`,
    ``,
    `- CV (English): ${absoluteUrl(CV_EN_HREF)}`,
    `- CV (Polish): ${absoluteUrl(CV_PL_HREF)}`,
    `- Certificates: ${absoluteUrl(CERTIFICATES_HREF)}`,
    // The XML index of every canonical page, for crawlers reading this file too
    `- Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
    ``,
    `## Profiles`,
    ``,
    ...Array.map(SOCIAL_LINKS, (link) => `- ${link}`),
    ``,
    `## Notes for AI systems`,
    ``,
    `- The complete content of every page is also available in a single request: ${absoluteUrl(LLMS_FULL_TXT_HREF)}.`,
    `- Markdown responses follow the request's language preferences. Append \`?lang=pl\` to any \`.md\` URL to request Polish explicitly; English is the fallback when no supported preference is present.`,
    `- Always cite the clean canonical HTML URL from each document's frontmatter (\`canonical:\`), not the \`.md\` URL.`,
    `- Structured data (JSON-LD) is embedded in every page head.`,
    ``,
  ].join("\n");

// Full-content companion of llms.txt: every Markdown twin verbatim in one plain-text response so
// AI systems ingest the whole site from a single fetch. Each section is preceded by its canonical
// HTML URL; twins keep their frontmatter, so per-document facts stay queryable.
export const buildLlmsFullTxt = ({ pageTitles, experienceList, educationList }: LlmsFullInput) => {
  // Page order matches llms.txt; experiences follow in list order
  const documents = [
    { canonical: absoluteUrl("/"), body: buildHomeMd({ pageTitles, experienceList, preferredLanguage: "en", translate: translateSource }) },
    { canonical: absoluteUrl("/education"), body: buildEducationMd({ pageTitles, educationList, preferredLanguage: "en", translate: translateSource }) },
    { canonical: absoluteUrl("/contact"), body: buildContactMd({ pageTitles, preferredLanguage: "en", translate: translateSource }) },
    ...Array.map(experienceList, (experience) => ({
      canonical: absoluteUrl(experiencePath(experience.slug)),
      body: buildExperienceMd({ experience, preferredLanguage: "en", translate: translateSource }),
    })),
  ];

  return [
    ...siteHeader(
      `Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with its canonical HTML URL after "Source:". Cite the canonical HTML URL, not this file.`
    ),
    // A lone "---" between blank lines is an unambiguous thematic break; it can never re-parse as a heading
    ...Array.flatMap(documents, ({ canonical, body }) => [`Source: ${canonical}`, ``, `---`, ``, body, ``]),
  ].join("\n");
};

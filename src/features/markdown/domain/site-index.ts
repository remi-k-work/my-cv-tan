// services, features, and other libraries
import { Array, String } from "effect";
import { experienceHeadline } from "@/features/experience/domain/helpers";
import { absoluteUrl, experiencePath } from "@/features/meta/domain/url";
import { buildExperienceMd, experienceLines } from "./experience";
import { escapeMdInline, mdBody, mdBulletList, mdDocument, mdHeading, mdQuote, mdSection, translateSource } from "./helpers";
import { buildContactMd, buildEducationMd, buildHomeMd } from "./pages";

// types
import type { ExperienceList } from "@/features/experience/domain/models";
import type { LlmsFullInput } from "./models";

// constants
import {
  CERTIFICATES_HREF,
  CONTACT_MD_HREF,
  CV_EN_HREF,
  CV_PL_HREF,
  DEFAULT_LANGUAGE,
  EDUCATION_MD_HREF,
  HOME_COUNTRY,
  HOME_COUNTRY_NAME,
  HOME_LOCALITY,
  HOME_MD_HREF,
  HOME_TITLE,
  JOB_TITLE,
  KNOWS_ABOUT,
  LLMS_FULL_TXT_HREF,
  PERSON_DESCRIPTION,
  SITEMAP_HREF,
  SITE_LANGUAGE_NAMES,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
} from "@/features/meta/domain/constants";

// Shared opening of both AI indexes: name, one-line positioning, and the full quotable bio
const siteOpening = () => [mdHeading(1, SITE_NAME), mdQuote(HOME_TITLE), PERSON_DESCRIPTION];

// Machine-readable site index for AI systems (GEO). Every entry points at a `.md`
// twin (never raw HTML) so crawlers fetch exactly one Markdown page at a time
export const buildLlmsTxt = (experienceList: ExperienceList) =>
  mdDocument([
    ...siteOpening(),
    mdSection(
      mdHeading(2, "About"),
      mdBody([
        "Self-taught web developer portfolio. Every page below has a machine-readable Markdown twin; fetch one linked `.md` page at a time.",
        // Dense factual claims first: AI systems cite what they can extract as unambiguous facts
        mdBulletList([
          `Name: ${SITE_NAME}`,
          `Website: ${SITE_URL}`,
          `Role: ${JOB_TITLE} (self-taught)`,
          `Based in: ${HOME_LOCALITY}, ${HOME_COUNTRY_NAME} (${HOME_COUNTRY})`,
          `Site languages: ${Array.join(SITE_LANGUAGE_NAMES, " and ")}`,
          `Focus: ${Array.join(KNOWS_ABOUT, ", ")}`,
        ]),
      ])
    ),
    mdSection(
      mdHeading(2, "Pages"),
      mdBulletList([
        `[Home](${absoluteUrl(HOME_MD_HREF)}): portfolio overview with experience and project lists.`,
        `[Education & Certificates](${absoluteUrl(EDUCATION_MD_HREF)}): schools, courses and certificates.`,
        `[Contact](${absoluteUrl(CONTACT_MD_HREF)}): contact form, location and social profiles.`,
        `[Full site content](${absoluteUrl(LLMS_FULL_TXT_HREF)}): every page above in one document, for single-request ingestion.`,
      ])
    ),
    mdSection(mdHeading(2, "Work Experience"), experienceLines({ experienceList, type: "e" })),
    mdSection(mdHeading(2, "Portfolio Projects"), experienceLines({ experienceList, type: "p" })),
    mdSection(
      mdHeading(2, "Documents"),
      mdBulletList([
        `CV (English): ${absoluteUrl(CV_EN_HREF)}`,
        `CV (Polish): ${absoluteUrl(CV_PL_HREF)}`,
        `Certificates: ${absoluteUrl(CERTIFICATES_HREF)}`,
        // The XML index of every canonical page, for crawlers reading this file too
        `Sitemap: ${absoluteUrl(SITEMAP_HREF)}`,
      ])
    ),
    mdSection(mdHeading(2, "Profiles"), mdBulletList(SOCIAL_LINKS)),
    mdSection(
      mdHeading(2, "Notes for AI systems"),
      mdBulletList([
        `The complete content of every page is also available in a single request: ${absoluteUrl(LLMS_FULL_TXT_HREF)}.`,
        "Markdown responses follow the request's language preferences. Append `?lang=pl` to any `.md` URL to request Polish explicitly; English is the fallback when no supported preference is present.",
        "Always cite the clean canonical HTML URL from each document's frontmatter (`canonical:`), not the `.md` URL.",
        "Structured data (JSON-LD) is embedded in every page head.",
      ])
    ),
  ]);

// Full-content companion of llms.txt: every Markdown twin verbatim in one plain-text response so
// AI systems ingest the whole site from a single fetch. A table of contents names each document
// up front; the twins keep their frontmatter, so per-document facts stay queryable
export const buildLlmsFullTxt = ({ pageTitles, experienceList, educationList }: LlmsFullInput) => {
  // Page order matches llms.txt; experiences follow in data order
  const documents = [
    {
      name: "Home",
      canonical: absoluteUrl("/"),
      body: buildHomeMd({ pageTitles, experienceList, preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource }),
    },
    {
      name: "Education & Certificates",
      canonical: absoluteUrl("/education"),
      body: buildEducationMd({ pageTitles, educationList, preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource }),
    },
    {
      name: "Contact",
      canonical: absoluteUrl("/contact"),
      body: buildContactMd({ pageTitles, preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource }),
    },
    ...Array.map(experienceList, (experience) => ({
      name: experienceHeadline(experience, DEFAULT_LANGUAGE),
      canonical: absoluteUrl(experiencePath(experience.slug)),
      body: buildExperienceMd({ experience, preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource }),
    })),
  ];

  return mdDocument([
    ...siteOpening(),
    'Complete Markdown content of every page, concatenated for single-request ingestion. Each section begins with its canonical HTML URL after "Source:". Cite the canonical HTML URL, not this file.',
    mdSection(mdHeading(2, "Table of Contents"), mdBulletList(Array.map(documents, ({ name, canonical }) => `[${escapeMdInline(name)}](${canonical})`))),
    // Each twin stays verbatim (frontmatter and H1 included); the Source line names the page it came from
    ...Array.map(documents, ({ canonical, body }) => mdBody([`Source: ${canonical}`, String.trimEnd(body)])),
  ]);
};

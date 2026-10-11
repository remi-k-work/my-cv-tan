// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain";
import { experienceHeadline, excerpt } from "@/features/experience/domain";
import { absoluteUrl, experienceImageUrl, experiencePath } from "./url";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience, ExperienceList } from "@/features/experience/domain";
import type { EducationJsonLdInput, ExperienceHeadInput, HomeJsonLdInput, JsonLdScript, LocalizedCopy } from "./models";

// constants
import {
  AVATAR_IMAGE,
  DESCRIPTION,
  GLOBAL_IMAGE,
  GLOBAL_SOCIAL_IMAGE,
  HOME_COUNTRY,
  HOME_LOCALITY,
  JOB_TITLE,
  KNOWS_ABOUT,
  META_DESCRIPTION_LENGTH,
  PERSON_ID,
  PROFILE_ID,
  PUBLISHER_ID,
  SITE_DESCRIPTION,
  SITE_LANGUAGES,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
  WEBSITE_ID,
} from "./constants";

// Serialized JSON lives inside a <script> tag; escaping "<" as "\u003C" stops
// content-sourced strings from breaking out of the tag while staying valid JSON
const jsonLdScript = (data: unknown): JsonLdScript => ({ type: "application/ld+json", children: JSON.stringify(data).replace(/</g, "\\u003C") });

// Every page emits exactly one script: nodes share a single @graph so @id cross-references stay intact in a single parser pass
const jsonLdGraph = (nodes: ReadonlyArray<unknown>): JsonLdScript => jsonLdScript({ "@context": "https://schema.org", "@graph": [...nodes] });

// List-derived nodes are only meaningful when the list decoded and is non-empty
const whenNonEmpty = <T, N>(list: ReadonlyArray<T>, build: (items: ReadonlyArray<T>) => N): ReadonlyArray<N> => (list.length === 0 ? [] : [build(list)]);

// Shared two-level trail: every subpage hangs directly off the homepage
const breadcrumb = (path: string, name: string) =>
  ({
    "@type": "BreadcrumbList",
    // Pages reference the trail by @id, associating it with the page node the way Google expects
    "@id": `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: [
      // Byte-equal to the homepage canonical so structured data and canonical signals agree
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  }) as const;

// Site-wide structured data: the site itself plus its author and publisher
export const websitePersonJsonLd = () =>
  jsonLdGraph([
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      // Same capped copy as the root meta description: one extractable summary everywhere
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      inLanguage: [...SITE_LANGUAGES],
      author: { "@id": PERSON_ID },
      publisher: { "@id": PUBLISHER_ID },
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: SITE_NAME,
      // The full bio gives AI systems a rich, quotable identity beyond the site summary
      description: DESCRIPTION,
      url: SITE_URL,
      image: AVATAR_IMAGE,
      jobTitle: JOB_TITLE,
      knowsAbout: [...KNOWS_ABOUT],
      // The site's bilingual audience is a factual GEO signal for AI extraction
      knowsLanguage: [...SITE_LANGUAGES],
      homeLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: HOME_LOCALITY,
          addressCountry: HOME_COUNTRY,
        },
      },
      sameAs: [...SOCIAL_LINKS],
    },
    {
      "@type": "Organization",
      "@id": PUBLISHER_ID,
      name: SITE_NAME,
      url: SITE_URL,
      // Dimensions single-sourced from the share image constant
      logo: { "@type": "ImageObject", url: GLOBAL_IMAGE, width: GLOBAL_SOCIAL_IMAGE.width, height: GLOBAL_SOCIAL_IMAGE.height },
      sameAs: [...SOCIAL_LINKS],
    },
  ]);

// One ItemList per experience kind: the labels mirror the HTML page and .md twin so AI
// systems can tell employment from projects instead of reading one mixed list
const experienceItemList = (id: string, name: string, type: Experience["type"], experienceList: ExperienceList, preferredLanguage: PreferredLanguage) =>
  whenNonEmpty(
    Array.filter(experienceList, (experience) => experience.type === type),
    (experiences) => ({
      "@type": "ItemList",
      "@id": id,
      name,
      inLanguage: preferredLanguage,
      numberOfItems: experiences.length,
      itemListElement: pipe(
        experiences,
        Array.map((experience, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: experienceHeadline(experience, preferredLanguage),
          url: absoluteUrl(experiencePath(experience.slug)),
        }))
      ),
    })
  );

// Home: a first-party ProfilePage about the author, plus one labeled list per experience kind
export const homeJsonLd = ({ title, description, experienceList, preferredLanguage }: HomeJsonLdInput) =>
  jsonLdGraph([
    {
      "@type": "ProfilePage",
      "@id": PROFILE_ID,
      url: SITE_URL,
      name: title,
      description,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": WEBSITE_ID },
      // First-party profile: the page is about the author of everything on the site
      mainEntity: { "@id": PERSON_ID },
    },
    ...experienceItemList(
      `${SITE_URL}/#experience-list`,
      matchPreferredLanguage(preferredLanguage, "Experience", "Doświadczenie"),
      "e",
      experienceList,
      preferredLanguage
    ),
    ...experienceItemList(
      `${SITE_URL}/#portfolio-list`,
      matchPreferredLanguage(preferredLanguage, "Portfolio Projects", "Projekty do Portfolio"),
      "p",
      experienceList,
      preferredLanguage
    ),
  ]);

// Education: the page itself plus attended schools, emitted on /education for GEO attribution
export const educationJsonLd = ({ title, description, educationList, preferredLanguage }: EducationJsonLdInput) => {
  const url = absoluteUrl("/education");
  // Stable fragment id per school: the person's alumniOf edges below reference them
  const schoolId = (index: number) => `${url}#school-${index + 1}`;
  return jsonLdGraph([
    {
      "@type": "CollectionPage",
      "@id": url,
      url,
      name: title,
      description,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      // Dropped by JSON.stringify when the school list is empty, so the page never references a missing list
      mainEntity: educationList.length === 0 ? undefined : { "@id": `${url}#education-list` },
    },
    ...whenNonEmpty(educationList, (schools) => ({
      "@type": "ItemList",
      "@id": `${url}#education-list`,
      name: `${SITE_NAME} — ${matchPreferredLanguage(preferredLanguage, "Education", "Edukacja")}`,
      inLanguage: preferredLanguage,
      numberOfItems: schools.length,
      itemListElement: pipe(
        schools,
        Array.map(({ name, info, location }, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "EducationalOrganization",
            "@id": schoolId(index),
            name,
            description: excerpt(info, META_DESCRIPTION_LENGTH),
            address: location,
            // The alumni edge ties each school back to the person, making "studied at" extractable
            alumni: { "@id": PERSON_ID },
          },
        }))
      ),
    })),
    // Person fragment that merges with the root graph's Person by @id: the reciprocal
    // edge lets extractors read "studied at" from either direction
    ...whenNonEmpty(educationList, (schools) => ({
      "@type": "Person",
      "@id": PERSON_ID,
      alumniOf: pipe(
        schools,
        Array.map((_, index) => ({ "@id": schoolId(index) }))
      ),
    })),
    breadcrumb("/education", title),
  ]);
};

// Contact: a ContactPage mirroring the visible content, the contact channel, and its breadcrumb
export const contactJsonLd = ({ title, description, preferredLanguage }: LocalizedCopy) => {
  const url = absoluteUrl("/contact");
  const contactPointId = `${url}#contact-point`;
  return jsonLdGraph([
    {
      "@type": "ContactPage",
      "@id": url,
      name: title,
      description,
      url,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      mainEntity: { "@id": PERSON_ID },
    },
    // Person fragment that merges with the root graph's Person by @id: attaches the contact channel
    {
      "@type": "Person",
      "@id": PERSON_ID,
      contactPoint: { "@id": contactPointId },
    },
    // The bilingual contact form is the channel; no email or phone is published
    {
      "@type": "ContactPoint",
      "@id": contactPointId,
      contactType: "author",
      url,
      availableLanguage: [...SITE_LANGUAGES],
    },
    breadcrumb("/contact", title),
  ]);
};

// Experience / project details: employment is a role at an organization, a project a creative work
export const experienceJsonLd = ({ experience, preferredLanguage }: ExperienceHeadInput) => {
  const { type, slug, role, company, txt, imageName, skillsUsed } = experience;
  // One named branch instead of three scattered ternaries
  const employment = type === "e";
  const path = experiencePath(slug);
  const url = absoluteUrl(path);
  const headline = experienceHeadline(experience, preferredLanguage);
  // Distinct fragment ids keep the two detail kinds separately addressable
  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);
  const image = pipe(
    experienceImageUrl(imageName),
    Option.getOrElse(() => GLOBAL_IMAGE)
  );

  const page = {
    "@type": "WebPage",
    "@id": url,
    url,
    name: headline,
    description,
    inLanguage: preferredLanguage,
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: { "@id": itemId },
  };

  // The page's main entity: a role for jobs, a creative work for projects
  const item = employment
    ? {
        "@type": "OrganizationRole",
        "@id": itemId,
        roleName: role,
        description,
        member: { "@id": PERSON_ID },
        mainEntityOfPage: { "@id": url },
      }
    : {
        "@type": "CreativeWork",
        "@id": itemId,
        name: role,
        description,
        image,
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        keywords: skillsUsed.join(", "),
      };

  // Employment pages also describe the employer, cross-referenced with the role
  const organization = employment
    ? [
        {
          "@type": "Organization",
          "@id": `${url}#organization`,
          name: company,
          member: { "@id": itemId },
        },
      ]
    : [];

  return jsonLdGraph([page, ...organization, item, breadcrumb(path, headline)]);
};

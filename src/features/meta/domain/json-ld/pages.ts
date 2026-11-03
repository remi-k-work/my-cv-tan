// Route-specific schema.org JSON-LD graph generators for leaf page heads.

// services, features, and other libraries
import { Array, Option } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt, experienceHeadline, partitionExperiences } from "@/features/experience/domain/helpers";
import { articleNode, collectionNode, imageObject, pageGraph, personEdge, webPageNode, type JsonLdNodes } from "./core";
import { absoluteUrl, experiencePath, experienceScreenshot } from "@/features/meta/domain/url";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceHeadInput } from "../models";
import type { LocalizedCopy } from "@/features/meta/domain/static-pages";

interface HomeJsonLdInput extends LocalizedCopy {
  readonly experienceList: ExperienceList;
}

interface EducationJsonLdInput extends LocalizedCopy {
  readonly educationList: EducationList;
}

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/features/meta/domain/static-pages";
import { META_DESCRIPTION_LENGTH, PERSON_ID, PROFILE_ID, PUBLISHER_ID, SITE_LANGUAGES, SITE_NAME, SITE_URL } from "@/features/meta/domain/constants";

// --- Home (ProfilePage) ---

const experienceCollection = (input: { id: string; name: string; experiences: ExperienceList; preferredLanguage: PreferredLanguage }): JsonLdNodes =>
  Array.match(input.experiences, {
    onEmpty: (): JsonLdNodes => [],
    onNonEmpty: (experiences) => [
      collectionNode({
        id: input.id,
        name: input.name,
        preferredLanguage: input.preferredLanguage,
        parts: Array.map(experiences, (experience) => {
          const url = absoluteUrl(experiencePath(experience.slug));
          return { "@type": "WebPage", "@id": url, url, name: experienceHeadline(experience, input.preferredLanguage) };
        }),
      }),
    ],
  });

const experienceCollections = (employment: ExperienceList, projects: ExperienceList, preferredLanguage: PreferredLanguage): JsonLdNodes => [
  ...experienceCollection({
    id: `${SITE_URL}/#experience-list`,
    name: matchPreferredLanguage(preferredLanguage, "Experience", "Doświadczenie"),
    experiences: employment,
    preferredLanguage,
  }),
  ...experienceCollection({
    id: `${SITE_URL}/#portfolio-list`,
    name: matchPreferredLanguage(preferredLanguage, "Portfolio Projects", "Projekty do Portfolio"),
    experiences: projects,
    preferredLanguage,
  }),
];

export const homeJsonLd = ({ pageName, description, experienceList, preferredLanguage }: HomeJsonLdInput): JsonLdNodes => {
  const [employment, projects] = partitionExperiences(experienceList);

  return [
    webPageNode({
      type: "ProfilePage",
      id: PROFILE_ID,
      url: absoluteUrl(HOME_PATH),
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: { "@id": PERSON_ID },
    }),
    ...experienceCollections(employment, projects, preferredLanguage),
  ];
};

// --- Education & Certificates (CollectionPage) ---

const educationCollectionId = (url: string) => `${url}#education-list`;

const schoolSubgraph = (url: string, educationList: EducationList, preferredLanguage: LocalizedCopy["preferredLanguage"]): JsonLdNodes =>
  Array.match(educationList, {
    onEmpty: (): JsonLdNodes => [],
    onNonEmpty: (schools) => {
      const schoolNodes = Array.map(schools, ({ name, info, location }, index) => ({
        "@type": "EducationalOrganization",
        "@id": `${url}#school-${index + 1}`,
        name,
        description: excerpt(info, META_DESCRIPTION_LENGTH),
        address: location,
        alumni: { "@id": PERSON_ID },
      }));

      return [
        collectionNode({
          id: educationCollectionId(url),
          url,
          name: `${SITE_NAME} — ${matchPreferredLanguage(preferredLanguage, "Education", "Edukacja")}`,
          preferredLanguage,
          parts: schoolNodes,
        }),
        personEdge({ alumniOf: Array.map(schoolNodes, ({ "@id": id }) => ({ "@id": id })) }),
      ];
    },
  });

export const educationJsonLd = ({ pageName, description, educationList, preferredLanguage }: EducationJsonLdInput): JsonLdNodes => {
  const url = absoluteUrl(EDUCATION_PATH);
  const schools = schoolSubgraph(url, educationList, preferredLanguage);

  return [
    ...pageGraph({
      type: "CollectionPage",
      path: EDUCATION_PATH,
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: schools.length > 0 ? { "@id": educationCollectionId(url) } : undefined,
    }),
    ...schools,
  ];
};

// --- Contact (ContactPage) ---

export const contactJsonLd = ({ pageName, description, preferredLanguage }: LocalizedCopy): JsonLdNodes => {
  const url = absoluteUrl(CONTACT_PATH);
  const contactPointId = `${url}#contact-point`;

  return [
    ...pageGraph({
      type: "ContactPage",
      path: CONTACT_PATH,
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: { "@id": PERSON_ID },
    }),
    personEdge({ contactPoint: { "@id": contactPointId } }),
    {
      "@type": "ContactPoint",
      "@id": contactPointId,
      contactType: "author",
      url,
      availableLanguage: [...SITE_LANGUAGES],
    },
  ];
};

// --- Experience Detail (WebPage + Article + OrganizationRole/SoftwareSourceCode) ---

export const experienceJsonLd = ({ experience, preferredLanguage }: ExperienceHeadInput): JsonLdNodes => {
  const { type, slug, role, company, txt, year, imageName, skillsUsed, gitHubLink } = experience;

  const employment = type === "e";
  const path = experiencePath(slug);
  const url = absoluteUrl(path);
  const headline = experienceHeadline(experience, preferredLanguage);

  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const articleId = `${url}#article`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  const screenshot = Option.map(experienceScreenshot(imageName), ({ src, width, height }) => imageObject(src, width, height));

  const page = pageGraph({
    type: "WebPage",
    path,
    name: headline,
    description,
    preferredLanguage,
    mainEntity: { "@id": articleId },
    primaryImageOfPage: Option.getOrUndefined(screenshot),
    datePublished: year,
  });

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
        "@type": gitHubLink ? "SoftwareSourceCode" : "CreativeWork",
        "@id": itemId,
        name: role,
        description,
        image: Option.getOrUndefined(screenshot),
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        keywords: Array.join(skillsUsed, ", "),
        codeRepository: gitHubLink,
      };

  const employmentNodes = employment
    ? [
        {
          "@type": "Organization",
          "@id": `${url}#organization`,
          name: company,
          member: { "@id": itemId },
        },
        item,
        personEdge({ worksFor: { "@id": `${url}#organization` } }),
      ]
    : [item];

  const article = articleNode({
    id: articleId,
    headline,
    description,
    preferredLanguage,
    datePublished: year,
    mainEntityOfPage: url,
  });

  return [...page, article, ...employmentNodes];
};

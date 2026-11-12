// services, features, and other libraries
import { Array, Option, pipe } from "effect";
import { excerpt, experienceHeadline, isEmployment, partitionExperiences } from "@/features/experience/domain/helpers";
import { matchPreferredLanguage } from "@/domain/helpers";
import { absoluteUrl, experiencePath, validatedHref } from "./urls";
import { articleNode, breadcrumb, collectionNode, experienceItemNode, imageObject, personEdge, webPageNode } from "./nodes";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceSeo, JsonLdNode, JsonLdNodes } from "./models";
import type { PageNodeType } from "./nodes";

// What the article/item graph reads from an experience's SEO identity; the full record is
// assignable, but naming the subset keeps the coupling explicit and drift-free
type ExperienceGraphInput = Pick<ExperienceSeo, "experience" | "preferredLanguage" | "path" | "headline" | "description" | "screenshot">;

// The page node (and its trail) every content page leads with
interface PageGraphSpec {
  readonly type: PageNodeType;
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
}

// The localized copy the static page graph assemblers read
interface LocalizedCopy {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}

// constants
import { SITE_LANGUAGES, CONTACT_PATH, EDUCATION_PATH } from "@/domain/constants";
import { EXPERIENCE_LIST_ID, HOME_URL, META_DESCRIPTION_LENGTH, PERSON_ID, PORTFOLIO_LIST_ID, PROFILE_ID } from "./site";

// Builds the page node and its breadcrumb trail using absolute URL as @id
const pageGraph = ({ type, path, name, description, preferredLanguage, mainEntity, primaryImageOfPage }: PageGraphSpec): JsonLdNodes => {
  const id = absoluteUrl(path);

  return [
    webPageNode({
      type,
      id,
      url: id,
      name,
      description,
      preferredLanguage,
      breadcrumb: true,
      mainEntity,
      primaryImageOfPage,
    }),
    breadcrumb(preferredLanguage, id, name),
  ];
};

const experienceCollection = ({
  id,
  name,
  experiences,
  preferredLanguage,
}: {
  readonly id: string;
  readonly name: string;
  readonly experiences: ExperienceList;
  readonly preferredLanguage: PreferredLanguage;
}): JsonLdNodes => {
  if (experiences.length === 0) return [];

  return [
    collectionNode({
      id,
      name,
      preferredLanguage,
      parts: Array.map(experiences, (experience) => {
        const url = absoluteUrl(experiencePath(experience.slug));
        return { "@type": "WebPage", "@id": url, url, name: experienceHeadline(experience, preferredLanguage) };
      }),
    }),
  ];
};

export const experienceCollections = (employment: ExperienceList, projects: ExperienceList, preferredLanguage: PreferredLanguage): JsonLdNodes => [
  ...experienceCollection({
    id: EXPERIENCE_LIST_ID,
    name: matchPreferredLanguage(preferredLanguage, "Experience", "Doświadczenie"),
    experiences: employment,
    preferredLanguage,
  }),
  ...experienceCollection({
    id: PORTFOLIO_LIST_ID,
    name: matchPreferredLanguage(preferredLanguage, "Portfolio Projects", "Projekty do Portfolio"),
    experiences: projects,
    preferredLanguage,
  }),
];

export const schoolSubgraph = (url: string, educationList: EducationList): JsonLdNodes => {
  if (educationList.length === 0) return [];

  const schoolNodes = Array.map(educationList, ({ name, info, location }, index) => ({
    "@type": "EducationalOrganization",
    "@id": `${url}#school-${index + 1}`,
    name,
    description: excerpt(info, META_DESCRIPTION_LENGTH),
    address: location,
    alumni: { "@id": PERSON_ID },
  }));

  return [...schoolNodes, personEdge({ alumniOf: Array.map(schoolNodes, ({ "@id": id }) => ({ "@id": id })) })];
};

export const educationJsonLd = ({
  pageName,
  description,
  educationList,
  preferredLanguage,
}: LocalizedCopy & { readonly educationList: EducationList }): JsonLdNodes => {
  const url = absoluteUrl(EDUCATION_PATH);
  const schools = schoolSubgraph(url, educationList);

  return [
    ...pageGraph({
      type: "CollectionPage",
      path: EDUCATION_PATH,
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: { "@id": PERSON_ID },
    }),
    ...schools,
  ];
};

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

export const experienceJsonLd = ({ experience, preferredLanguage, path, headline, description, screenshot }: ExperienceGraphInput): JsonLdNodes => {
  const { role, company, skillsUsed, gitHubLink } = experience;

  const employment = isEmployment(experience);
  const url = absoluteUrl(path);

  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const articleId = `${url}#article`;

  // Both optional projections stay Options until the node inputs collapse them, and read as one
  // pipe rather than a nested pair of calls
  const image = pipe(
    screenshot,
    Option.map(({ src, width, height }) => imageObject(src, width, height)),
    Option.getOrUndefined
  );
  const repository = pipe(gitHubLink, validatedHref, Option.getOrUndefined);

  const item = experienceItemNode({ employment, id: itemId, url, role, description, preferredLanguage, keywords: skillsUsed, image, repository });

  const itemNodes: JsonLdNodes = employment
    ? [
        { "@type": "Organization", "@id": `${url}#organization`, name: company, member: { "@id": PERSON_ID } },
        item,
        personEdge({ worksFor: { "@id": `${url}#organization` } }),
      ]
    : [item];

  const article = articleNode({
    id: articleId,
    headline,
    description,
    preferredLanguage,
    about: itemId,
    mainEntityOfPage: url,
    image,
  });

  return [
    ...pageGraph({ type: "WebPage", path, name: headline, description, preferredLanguage, mainEntity: { "@id": articleId }, primaryImageOfPage: image }),
    article,
    ...itemNodes,
  ];
};

export const homeJsonLd = ({
  pageName,
  description,
  experienceList,
  preferredLanguage,
}: LocalizedCopy & { readonly experienceList: ExperienceList }): JsonLdNodes => {
  const [employment, projects] = partitionExperiences(experienceList);

  return [
    webPageNode({
      type: "ProfilePage",
      id: PROFILE_ID,
      url: HOME_URL,
      name: pageName,
      description,
      preferredLanguage,
      mainEntity: { "@id": PERSON_ID },
    }),
    ...experienceCollections(employment, projects, preferredLanguage),
  ];
};

// Page JSON-LD graph assembly: the page-node pair every content page publishes, the collection
// subgraphs that group the site's content, and the per-page assemblers that combine them.

// services, features, and other libraries
import { Option, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt, experienceHeadline, partitionExperiences } from "@/features/experience/domain/helpers";

// domain
import { absoluteUrl, experiencePath, httpUrlOption } from "./urls";
import { articleNode, breadcrumb, collectionNode, imageObject, personEdge, webPageNode } from "./nodes";

// constants
import { SITE_LANGUAGES } from "@/domain/constants";
import {
  CONTACT_PATH,
  EDUCATION_PATH,
  EXPERIENCE_LIST_ID,
  HOME_URL,
  META_DESCRIPTION_LENGTH,
  PERSON_ID,
  PORTFOLIO_LIST_ID,
  PROFILE_ID,
  PUBLISHER_ID,
  SITE_NAME,
} from "./constants";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PreferredLanguage } from "@/domain/models";
import type { ExperienceGraphInput, JsonLdNode, JsonLdNodes, LocalizedCopy } from "./models";
import type { PageNodeType } from "./nodes";

// --- The shared page-node pair ---

// Emits a WebPage node paired with its two-level breadcrumb trail. Every content page publishes
// this pair, so it is decided once here rather than repeated in each builder below. The page's
// absolute URL doubles as its @id so the two spellings can never disagree.
export const pageGraph = ({
  type,
  path,
  name,
  description,
  preferredLanguage,
  mainEntity,
  primaryImageOfPage,
}: {
  readonly type: PageNodeType;
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
}): JsonLdNodes => {
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

// --- Collection subgraphs ---

// Grouped content lists that sit beside a page's own node: experience lists split into employment
// and portfolio; school lists group attended institutions.

// Builds one experience collection node (employment or portfolio) with its detail-page parts.
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
      parts: experiences.map((experience) => {
        const url = absoluteUrl(experiencePath(experience.slug));
        return { "@type": "WebPage", "@id": url, url, name: experienceHeadline(experience, preferredLanguage) };
      }),
    }),
  ];
};

// Builds both experience collections (employment then portfolio) for the homepage graph.
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

export const educationCollectionId = (url: string) => `${url}#education-list`;

// Builds the school collection plus the Person alumniOf edge for the education page.
export const schoolSubgraph = (url: string, educationList: EducationList, preferredLanguage: PreferredLanguage): JsonLdNodes => {
  if (educationList.length === 0) return [];

  const schoolNodes = educationList.map(({ name, info, location }, index) => ({
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
    personEdge({ alumniOf: schoolNodes.map(({ "@id": id }) => ({ "@id": id })) }),
  ];
};

// --- Per-page graphs ---

// Education page: CollectionPage plus its school subgraph.
export const educationJsonLd = ({
  pageName,
  description,
  educationList,
  preferredLanguage,
}: LocalizedCopy & { readonly educationList: EducationList }): JsonLdNodes => {
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

// Contact page: ContactPage plus a ContactPoint node and the Person contactPoint edge.
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

// Experience detail page: WebPage + Article + item node (OrganizationRole or project type).
// Every URL here derives from the route path, so the page, its article, and its subject cannot
// disagree about which address they describe.
export const experienceJsonLd = ({ experience, preferredLanguage, path, headline, description, screenshot }: ExperienceGraphInput): JsonLdNodes => {
  const { type, role, company, skillsUsed, gitHubLink } = experience;

  const employment = type === "e";
  const url = absoluteUrl(path);

  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const articleId = `${url}#article`;

  const image = Option.match(screenshot, {
    onNone: () => undefined,
    onSome: ({ src, width, height }) => imageObject(src, width, height),
  });

  // The schema accepts any non-empty repository string, so validate the scheme before publishing
  // it: JSON-LD is crawler-facing exactly like the Markdown twin's link list.
  const repository = pipe(Option.fromNullishOr(gitHubLink), Option.flatMap(httpUrlOption), Option.getOrUndefined);

  const page = pageGraph({
    type: "WebPage",
    path,
    name: headline,
    description,
    preferredLanguage,
    mainEntity: { "@id": articleId },
    primaryImageOfPage: image,
  });

  const item: JsonLdNode = employment
    ? {
        "@type": "OrganizationRole",
        "@id": itemId,
        roleName: role,
        description,
        member: { "@id": PERSON_ID },
        mainEntityOfPage: { "@id": url },
      }
    : {
        // The source-code type is a claim that this page's code is published, so it follows the
        // validated repository rather than the raw field: a dropped scheme leaves a CreativeWork
        // instead of a SoftwareSourceCode that advertises code it cannot link to.
        "@type": repository !== undefined ? "SoftwareSourceCode" : "CreativeWork",
        "@id": itemId,
        name: role,
        description,
        ...(image !== undefined ? { image } : {}),
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        keywords: skillsUsed.join(", "),
        ...(repository !== undefined ? { codeRepository: repository } : {}),
      };

  const employmentNodes: JsonLdNodes = employment
    ? [
        // The employer claims the person as its member; the role node above carries the role itself.
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

  return [...page, article, ...employmentNodes];
};

// Homepage graph: ProfilePage linking the Person, plus both experience collections.
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

// schema.org JSON-LD graph construction for site entities and page heads.

// services, features, and other libraries
import { Option, Predicate } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";
import { excerpt, experienceHeadline, partitionExperiences } from "@/features/experience/domain/helpers";
import { absoluteUrl, experiencePath, experienceScreenshot } from "./helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceHeadInput, JsonLdNode, JsonLdNodes, JsonLdScript, LocalizedCopy } from "./models";

// constants
import {
  AVATAR,
  CONTACT_PATH,
  EDUCATION_PATH,
  HOME_COUNTRY,
  HOME_LOCALITY,
  HOME_PATH,
  JOB_TITLE,
  KNOWS_ABOUT,
  META_DESCRIPTION_LENGTH,
  PERSON_DESCRIPTION,
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

type PageNodeType = "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";

interface ArticleNodeInput {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly about: string;
  readonly mainEntityOfPage: string;
  readonly datePublished?: string;
}

interface WebPageNodeInput {
  readonly type: PageNodeType;
  readonly id: string;
  readonly url?: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly breadcrumb?: boolean;
  readonly mainEntity?: unknown;
  readonly primaryImageOfPage?: unknown;
  readonly datePublished?: string;
}

interface CollectionNodeInput {
  readonly id: string;
  readonly name: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly parts: ReadonlyArray<unknown>;
  readonly url?: string;
}

type SubPageInput = Omit<WebPageNodeInput, "id" | "url" | "breadcrumb"> & { readonly path: string };

interface HomeJsonLdInput extends LocalizedCopy {
  readonly experienceList: ExperienceList;
}

interface EducationJsonLdInput extends LocalizedCopy {
  readonly educationList: EducationList;
}

// --- Graph primitives ---

const SCHEMA_CONTEXT = "https://schema.org";

// Escapes '<' so serialized content can never close the script tag.
const jsonLdScript = (data: unknown): JsonLdScript => ({
  type: "application/ld+json",
  children: JSON.stringify(data).replace(/</g, "\\u003C"),
});

// Merges nodes by @id, preserving order and letting defined fields override.
export const jsonLdGraph = (nodes: ReadonlyArray<JsonLdNode>): JsonLdScript => {
  const graph: Array<JsonLdNode> = [];
  const indexById = new Map<string, number>();

  for (const node of nodes) {
    const definedNode = Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined)) as JsonLdNode;
    const id = definedNode["@id"];
    if (!Predicate.isString(id)) {
      graph.push(definedNode);
      continue;
    }

    const existingIndex = indexById.get(id);
    if (existingIndex === undefined) {
      indexById.set(id, graph.length);
      graph.push(definedNode);
    } else {
      graph[existingIndex] = { ...graph[existingIndex]!, ...definedNode };
    }
  }

  return jsonLdScript({ "@context": SCHEMA_CONTEXT, "@graph": graph });
};

// --- Node builders ---

const articleNode = (input: ArticleNodeInput): JsonLdNode => ({
  "@type": "Article",
  "@id": input.id,
  headline: input.headline,
  description: input.description,
  inLanguage: input.preferredLanguage,
  author: { "@id": PERSON_ID },
  publisher: { "@id": PUBLISHER_ID },
  about: { "@id": input.about },
  ...(input.datePublished !== undefined ? { datePublished: input.datePublished } : {}),
  mainEntityOfPage: { "@id": input.mainEntityOfPage },
});

const webPageNode = (input: WebPageNodeInput): JsonLdNode => ({
  "@type": input.type,
  "@id": input.id,
  ...(input.url !== undefined ? { url: input.url } : {}),
  name: input.name,
  description: input.description,
  inLanguage: input.preferredLanguage,
  isPartOf: { "@id": WEBSITE_ID },
  ...(input.breadcrumb ? { breadcrumb: { "@id": `${input.id}#breadcrumb` } } : {}),
  ...(input.mainEntity !== undefined ? { mainEntity: input.mainEntity } : {}),
  ...(input.primaryImageOfPage !== undefined ? { primaryImageOfPage: input.primaryImageOfPage } : {}),
  ...(input.datePublished !== undefined ? { datePublished: input.datePublished } : {}),
});

const collectionNode = (input: CollectionNodeInput): JsonLdNode => ({
  "@type": "Collection",
  "@id": input.id,
  ...(input.url !== undefined ? { url: input.url } : {}),
  name: input.name,
  inLanguage: input.preferredLanguage,
  hasPart: input.parts,
});

const imageObject = (url: string, width: number, height: number) => ({ "@type": "ImageObject", url, width, height }) as const;

const breadcrumb = (preferredLanguage: PreferredLanguage, path: string, name: string) =>
  ({
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: matchPreferredLanguage(preferredLanguage, "Home", "Strona główna"), item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name, item: absoluteUrl(path) },
    ],
  }) as const;

// Extends the site Person entity with an additional edge during graph merging.
const personEdge = <Fields extends Readonly<Record<string, unknown>>>(fields: Fields): JsonLdNode => ({
  "@type": "Person",
  "@id": PERSON_ID,
  ...fields,
});

// Emits a WebPage node paired with its two-level breadcrumb list.
export const pageGraph = ({ type, path, name, description, preferredLanguage, mainEntity, primaryImageOfPage, datePublished }: SubPageInput): JsonLdNodes => {
  const id = absoluteUrl(path);

  return [
    webPageNode({ type, id, url: id, name, description, preferredLanguage, breadcrumb: true, mainEntity, primaryImageOfPage, datePublished }),
    breadcrumb(preferredLanguage, path, name),
  ];
};

// --- Site entities ---

const POSTAL_ADDRESS = { "@type": "PostalAddress", addressLocality: HOME_LOCALITY, addressCountry: HOME_COUNTRY } as const;
const AVATAR_IMAGE_OBJECT = imageObject(AVATAR.src, AVATAR.width, AVATAR.height);
const HOME_URL = absoluteUrl(HOME_PATH);

// Site-wide entities merged into every page head.
export const siteNodes: JsonLdNodes = [
  {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: HOME_URL,
    inLanguage: [...SITE_LANGUAGES],
    author: { "@id": PERSON_ID },
    publisher: { "@id": PUBLISHER_ID },
  },
  {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_NAME,
    alternateName: "Remi Forge",
    description: PERSON_DESCRIPTION,
    url: HOME_URL,
    image: AVATAR_IMAGE_OBJECT,
    jobTitle: JOB_TITLE,
    knowsAbout: [...KNOWS_ABOUT],
    knowsLanguage: [...SITE_LANGUAGES],
    address: POSTAL_ADDRESS,
    sameAs: [...SOCIAL_LINKS],
  },
  {
    "@type": "Organization",
    "@id": PUBLISHER_ID,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: HOME_URL,
    address: POSTAL_ADDRESS,
    logo: AVATAR_IMAGE_OBJECT,
    sameAs: [...SOCIAL_LINKS],
    member: { "@id": PERSON_ID },
  },
];

// --- Page graphs ---

const experienceCollection = (input: { id: string; name: string; experiences: ExperienceList; preferredLanguage: PreferredLanguage }): JsonLdNodes => {
  if (input.experiences.length === 0) return [];

  return [
    collectionNode({
      id: input.id,
      name: input.name,
      preferredLanguage: input.preferredLanguage,
      parts: input.experiences.map((experience) => {
        const url = absoluteUrl(experiencePath(experience.slug));
        return { "@type": "WebPage", "@id": url, url, name: experienceHeadline(experience, input.preferredLanguage) };
      }),
    }),
  ];
};

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

const educationCollectionId = (url: string) => `${url}#education-list`;

const schoolSubgraph = (url: string, educationList: EducationList, preferredLanguage: PreferredLanguage): JsonLdNodes => {
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

export const experienceJsonLd = ({ experience, preferredLanguage }: ExperienceHeadInput): JsonLdNodes => {
  const { type, slug, role, company, txt, year, imageName, skillsUsed, gitHubLink } = experience;

  const employment = type === "e";
  const path = experiencePath(slug);
  const url = absoluteUrl(path);
  const headline = experienceHeadline(experience, preferredLanguage);

  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const articleId = `${url}#article`;
  const description = excerpt(txt, META_DESCRIPTION_LENGTH);

  const screenshot = Option.match(experienceScreenshot(imageName), {
    onNone: () => undefined,
    onSome: ({ src, width, height }) => imageObject(src, width, height),
  });

  const page = pageGraph({
    type: "WebPage",
    path,
    name: headline,
    description,
    preferredLanguage,
    mainEntity: { "@id": articleId },
    primaryImageOfPage: screenshot,
    datePublished: year,
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
        "@type": gitHubLink ? "SoftwareSourceCode" : "CreativeWork",
        "@id": itemId,
        name: role,
        description,
        ...(screenshot !== undefined ? { image: screenshot } : {}),
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        keywords: skillsUsed.join(", "),
        ...(gitHubLink !== undefined ? { codeRepository: gitHubLink } : {}),
      };

  const employmentNodes: JsonLdNodes = employment
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
    about: itemId,
    datePublished: year,
    mainEntityOfPage: url,
  });

  return [...page, article, ...employmentNodes];
};

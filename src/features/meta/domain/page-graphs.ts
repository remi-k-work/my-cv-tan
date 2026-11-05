// Page-specific JSON-LD graph assemblers. Each pulls together the page node (from ./page-node),
// any collections (from ./collections), and page-unique nodes into one subgraph.

// services, features, and other libraries
import { Option } from "effect";
import { partitionExperiences } from "@/features/experience/domain/helpers";

// domain
import { pageGraph } from "./page-node";
import { schoolSubgraph, educationCollectionId, experienceCollections } from "./collections";
import { articleNode } from "./nodes";
import { absoluteUrl } from "./urls";

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_URL, PERSON_ID, SITE_LANGUAGES } from "./constants";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PreferredLanguage } from "@/domain/models";
import type { ExperienceSeo } from "./experience-seo";
import type { JsonLdNode, JsonLdNodes } from "./models";

// Education page: CollectionPage plus its school subgraph.
export const educationJsonLd = ({
  pageName,
  description,
  educationList,
  preferredLanguage,
}: {
  readonly pageName: string;
  readonly description: string;
  readonly educationList: EducationList;
  readonly preferredLanguage: PreferredLanguage;
}): JsonLdNodes => {
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
export const contactJsonLd = ({
  pageName,
  description,
  preferredLanguage,
}: {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}): JsonLdNodes => {
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
    { "@type": "Person", "@id": PERSON_ID, contactPoint: { "@id": contactPointId } },
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
export const experienceJsonLd = ({ experience, preferredLanguage, path, canonical: url, headline, description, screenshot }: ExperienceSeo): JsonLdNodes => {
  const { type, role, company, year, skillsUsed, gitHubLink } = experience;

  const employment = type === "e";

  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const articleId = `${url}#article`;

  const image = Option.match(screenshot, {
    onNone: () => undefined,
    onSome: ({ src, width, height }) => ({ "@type": "ImageObject", url: src, width, height }),
  });

  const page = pageGraph({
    type: "WebPage",
    path,
    name: headline,
    description,
    preferredLanguage,
    mainEntity: { "@id": articleId },
    primaryImageOfPage: image,
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
        ...(image !== undefined ? { image } : {}),
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": `${HOME_URL}#publisher` },
        keywords: skillsUsed.join(", "),
        ...(gitHubLink !== undefined ? { codeRepository: gitHubLink } : {}),
      };

  const employmentNodes: JsonLdNodes = employment
    ? [
        { "@type": "Organization", "@id": `${url}#organization`, name: company, member: { "@id": itemId } },
        item,
        { "@type": "Person", "@id": PERSON_ID, worksFor: { "@id": `${url}#organization` } },
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

// Homepage graph: ProfilePage linking the Person, plus both experience collections.
export const homeJsonLd = ({
  pageName,
  description,
  experienceList,
  preferredLanguage,
}: {
  readonly pageName: string;
  readonly description: string;
  readonly experienceList: ExperienceList;
  readonly preferredLanguage: PreferredLanguage;
}): JsonLdNodes => {
  const [employment, projects] = partitionExperiences(experienceList);

  return [
    {
      "@type": "ProfilePage",
      "@id": `${HOME_URL}#profile`,
      url: HOME_URL,
      name: pageName,
      description,
      inLanguage: preferredLanguage,
      isPartOf: { "@id": `${HOME_URL}#website` },
      mainEntity: { "@id": `${HOME_URL}#person` },
    },
    ...experienceCollections(employment, projects, preferredLanguage),
  ];
};

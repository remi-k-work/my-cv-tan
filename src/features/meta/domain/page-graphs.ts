// Page-specific JSON-LD graph assemblers. Each pulls together the page node (from ./page-node),
// any collections (from ./collections), and page-unique nodes into one subgraph.

// services, features, and other libraries
import { Option } from "effect";
import { partitionExperiences } from "@/features/experience/domain/helpers";

// domain
import { pageGraph } from "./page-node";
import { schoolSubgraph, educationCollectionId, experienceCollections } from "./collections";
import { articleNode, imageObject, webPageNode } from "./nodes";
import { absoluteUrl } from "./urls";

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_URL, PERSON_ID, PROFILE_ID, PUBLISHER_ID, SITE_LANGUAGES } from "./constants";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceGraphInput, JsonLdNode, JsonLdNodes, LocalizedCopy } from "./models";

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
        "@type": gitHubLink ? "SoftwareSourceCode" : "CreativeWork",
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
        ...(gitHubLink !== undefined ? { codeRepository: gitHubLink } : {}),
      };

  const employmentNodes: JsonLdNodes = employment
    ? [
        // The employer claims the person as its member; the role node above carries the role itself.
        { "@type": "Organization", "@id": `${url}#organization`, name: company, member: { "@id": PERSON_ID } },
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

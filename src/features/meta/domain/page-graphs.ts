// Per-page JSON-LD graph assembly: the page-node pair every content page leads with, each page's
// own nodes, and the collection subgraphs that group the site's content beside a page node.

// services, features, and other libraries
import { Option } from "effect";
import { excerpt, experienceHeadline, isEmployment, partitionExperiences } from "@/features/experience/domain/helpers";
import { matchPreferredLanguage } from "@/domain/helpers";

// domain
import { articleNode, breadcrumb, collectionNode, EXPERIENCE_LIST_ID, experienceItemNode, imageObject, PERSON_ID, personEdge, PORTFOLIO_LIST_ID, PROFILE_ID, webPageNode } from "./nodes";
import { absoluteUrl, experiencePath, validatedHref } from "./urls";

// constants
import { SITE_LANGUAGES, CONTACT_PATH, EDUCATION_PATH } from "@/domain/constants";
import { HOME_URL, META_DESCRIPTION_LENGTH, SITE_NAME } from "./identity";

// types
import type { ExperienceGraphInput } from "./experience-seo";
import type { LocalizedCopy } from "./pages";
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { JsonLdNode, JsonLdNodes } from "./models";
import type { PageNodeType } from "./nodes";

// The page's own node plus its trail, declared from the route path alone.
interface PageGraphSpec {
  readonly type: PageNodeType;
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
}

// The page's absolute URL doubles as its @id so the two spellings can never disagree, and a parser
// resolves the page from the node itself instead of interpreting a host-rooted @id first.
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
    // The trail hangs off the same id, so the pair is one addressable entity a parser resolves in
    // a single pass rather than two.
    breadcrumb(preferredLanguage, id, name),
  ];
};

// --- Collections ---

// Builds one experience collection node (employment or portfolio) with its detail-page parts.
// An empty list emits nothing at all, so no page publishes a misleading empty collection.
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

// Each school gets a stable fragment id the person's alumniOf edges reference.
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

// --- Page graphs ---

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
  const { role, company, skillsUsed, gitHubLink } = experience;

  const employment = isEmployment(experience);
  const url = absoluteUrl(path);

  const itemId = `${url}#${employment ? "organization-role" : "project"}`;
  const articleId = `${url}#article`;

  // The page's verified picture, when it publishes one: the WebPage, its subject and the Article
  // all carry the same sized ImageObject, so a reader resolving any one of them sees the image.
  const image = Option.getOrUndefined(Option.map(screenshot, ({ src, width, height }) => imageObject(src, width, height)));

  // The schema accepts any non-empty repository string, so validate the scheme before publishing
  // it: JSON-LD is crawler-facing exactly like the Markdown twin's link list.
  const repository = Option.getOrUndefined(validatedHref(gitHubLink));

  const item = experienceItemNode({ employment, id: itemId, url, role, description, preferredLanguage, keywords: skillsUsed, image, repository });

  const itemNodes: JsonLdNodes = employment
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

  return [
    ...pageGraph({ type: "WebPage", path, name: headline, description, preferredLanguage, mainEntity: { "@id": articleId }, primaryImageOfPage: image }),
    article,
    ...itemNodes,
  ];
};

// Homepage graph: ProfilePage linking the Person, plus both experience collections. The home page
// is the site root, so its page node carries no breadcrumb trail and is declared directly.
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

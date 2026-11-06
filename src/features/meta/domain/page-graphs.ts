// Per-page JSON-LD graph assembly: the page-node pair every content page publishes
// (`pageGraph` below) plus each page's own nodes and the collection subgraphs from ./collections.

// services, features, and other libraries
import { Option } from "effect";
import { partitionExperiences } from "@/features/experience/domain/helpers";

// domain
import { experienceCollections, educationCollectionId, schoolSubgraph } from "./collections";
import { articleNode, breadcrumb, experienceItemNode, imageObject, personEdge, webPageNode } from "./nodes";
import { absoluteUrl, validatedHref } from "./urls";

// constants
import { SITE_LANGUAGES } from "@/domain/constants";
import { CONTACT_PATH, EDUCATION_PATH, HOME_URL, PERSON_ID, PROFILE_ID } from "./constants";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { ExperienceGraphInput, JsonLdNode, JsonLdNodes, LocalizedCopy } from "./models";
import type { PageNodeType } from "./nodes";

// The page's absolute URL doubles as its @id so the two spellings can never disagree, and a parser
// resolves the page from the node itself instead of interpreting a host-rooted @id first.
const pageGraph = ({
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
    // The trail hangs off the same id, so the pair is one addressable entity a parser resolves in
    // a single pass rather than two.
    breadcrumb(preferredLanguage, id, name),
  ];
};

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

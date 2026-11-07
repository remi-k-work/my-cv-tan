// Every schema.org node this site publishes: the per-kind node builders and the `@id`s the graph
// merges by. Each builder is pure — a node is built without merging it, serializing it, or reading
// another builder's output. How a node list becomes one document script, and the site-wide entity
// set every page graph merges into, live in ./graph.

// services, features, and other libraries
import { matchPreferredLanguage } from "@/domain/helpers";

// constants
import { HOME_URL } from "./identity";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdNode, JsonLdObject } from "./models";

// --- Graph identity ---

// The fragment identifiers the JSON-LD graph merges by. Every one is the canonical homepage with a
// fragment, so a parser resolving a node from the page it is embedded in lands on a stable address,
// and a page graph's `personEdge` folds into the same Person the site entity declares.
export const WEBSITE_ID = `${HOME_URL}#website`;
export const PERSON_ID = `${HOME_URL}#person`;
export const PUBLISHER_ID = `${HOME_URL}#publisher`;
export const PROFILE_ID = `${HOME_URL}#profile`;

// Site-level content collections merged into page graphs.
export const EXPERIENCE_LIST_ID = `${HOME_URL}#experience-list`;
export const PORTFOLIO_LIST_ID = `${HOME_URL}#portfolio-list`;

export type PageNodeType = "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";

interface ArticleNodeInput {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly about: string;
  readonly mainEntityOfPage: string;
  readonly image?: JsonLdNode;
}

interface WebPageNodeInput {
  readonly type: PageNodeType;
  readonly id: string;
  readonly url: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly breadcrumb?: boolean;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
}

interface CollectionNodeInput {
  readonly id: string;
  readonly name: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly parts: ReadonlyArray<JsonLdNode>;
  readonly url?: string;
}

// --- Node builders ---

export const articleNode = ({ id, headline, description, preferredLanguage, about, mainEntityOfPage, image }: ArticleNodeInput): JsonLdNode => ({
  "@type": "Article",
  "@id": id,
  headline,
  description,
  inLanguage: preferredLanguage,
  author: { "@id": PERSON_ID },
  publisher: { "@id": PUBLISHER_ID },
  about: { "@id": about },
  mainEntityOfPage: { "@id": mainEntityOfPage },
  ...(image !== undefined ? { image } : {}),
});

export const webPageNode = ({
  type,
  id,
  url,
  name,
  description,
  preferredLanguage,
  breadcrumb: hasBreadcrumb,
  mainEntity,
  primaryImageOfPage,
}: WebPageNodeInput): JsonLdNode => ({
  "@type": type,
  "@id": id,
  url,
  name,
  description,
  inLanguage: preferredLanguage,
  isPartOf: { "@id": WEBSITE_ID },
  ...(hasBreadcrumb ? { breadcrumb: { "@id": `${id}#breadcrumb` } } : {}),
  ...(mainEntity !== undefined ? { mainEntity } : {}),
  ...(primaryImageOfPage !== undefined ? { primaryImageOfPage } : {}),
});

export const collectionNode = ({ id, name, preferredLanguage, parts, url }: CollectionNodeInput): JsonLdNode => ({
  "@type": "Collection",
  "@id": id,
  ...(url !== undefined ? { url } : {}),
  name,
  inLanguage: preferredLanguage,
  hasPart: parts,
});

export const imageObject = (url: string, width: number, height: number) => ({ "@type": "ImageObject", url, width, height }) as const;

export const breadcrumb = (preferredLanguage: PreferredLanguage, url: string, name: string) =>
  ({
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: matchPreferredLanguage(preferredLanguage, "Home", "Strona główna"), item: HOME_URL },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  }) as const;

interface ExperienceItemNodeInput {
  readonly employment: boolean;
  readonly id: string;
  readonly url: string;
  readonly role: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly keywords: ReadonlyArray<string>;
  readonly image?: JsonLdNode;
  readonly repository?: string;
}

// The subject node of an experience detail page: an OrganizationRole for employment, or the project
// itself. SoftwareSourceCode is a claim that this page's code is published, so it follows the
// validated repository rather than the raw field — a dropped scheme leaves a CreativeWork instead
// of advertising code the site cannot link to.
export const experienceItemNode = ({
  employment,
  id,
  url,
  role,
  description,
  preferredLanguage,
  keywords,
  image,
  repository,
}: ExperienceItemNodeInput): JsonLdNode =>
  employment
    ? {
        "@type": "OrganizationRole",
        "@id": id,
        roleName: role,
        description,
        member: { "@id": PERSON_ID },
        mainEntityOfPage: { "@id": url },
      }
    : {
        "@type": repository === undefined ? "CreativeWork" : "SoftwareSourceCode",
        "@id": id,
        name: role,
        description,
        ...(image !== undefined ? { image } : {}),
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        keywords: keywords.join(", "),
        ...(repository === undefined ? {} : { codeRepository: repository }),
      };

// Extends the site Person entity with an additional edge during graph merging.
export const personEdge = (fields: JsonLdObject): JsonLdNode => ({
  "@type": "Person",
  "@id": PERSON_ID,
  ...fields,
});

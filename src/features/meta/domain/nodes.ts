// services, features, and other libraries
import { Array } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdNode, JsonLdObject } from "./models";

// The page-node vocabulary this module's builders share with the graph assemblers
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

// constants
import { HOME_URL, PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "./site";

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

// Builds an OrganizationRole for employment or SoftwareSourceCode/CreativeWork for projects.
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
        // The same join the Markdown twin's `skills` fact publishes, so the two spellings cannot drift
        keywords: Array.join(keywords, ", "),
        ...(repository === undefined ? {} : { codeRepository: repository }),
      };

// Extends the site Person entity with an additional edge during graph merging.
export const personEdge = (fields: JsonLdObject): JsonLdNode => ({
  "@type": "Person",
  "@id": PERSON_ID,
  ...fields,
});

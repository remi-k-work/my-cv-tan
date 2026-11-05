// Individual schema.org JSON-LD node builders. Each builds one kind of node
// and is pure: no graph merge, no serialization, no dependencies on other builders.

// services, features, and other libraries
import { matchPreferredLanguage } from "@/domain/helpers";

// constants
import { HOME_URL, PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "./constants";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdNode } from "./models";

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
  readonly url: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly breadcrumb?: boolean;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
  readonly datePublished?: string;
}

interface CollectionNodeInput {
  readonly id: string;
  readonly name: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly parts: ReadonlyArray<JsonLdNode>;
  readonly url?: string;
}

// --- Node builders ---

export const articleNode = ({ id, headline, description, preferredLanguage, about, mainEntityOfPage, datePublished }: ArticleNodeInput): JsonLdNode => ({
  "@type": "Article",
  "@id": id,
  headline,
  description,
  inLanguage: preferredLanguage,
  author: { "@id": PERSON_ID },
  publisher: { "@id": PUBLISHER_ID },
  about: { "@id": about },
  ...(datePublished !== undefined ? { datePublished } : {}),
  mainEntityOfPage: { "@id": mainEntityOfPage },
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
  datePublished,
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
  ...(datePublished !== undefined ? { datePublished } : {}),
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

// Extends the site Person entity with an additional edge during graph merging.
export const personEdge = <Fields extends Readonly<Record<string, unknown>>>(fields: Fields): JsonLdNode => ({
  "@type": "Person",
  "@id": PERSON_ID,
  ...fields,
});

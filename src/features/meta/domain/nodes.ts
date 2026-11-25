// services, features, and other libraries
import { Array, Match, Predicate, Record } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { JsonLdNode, JsonLdNodes, JsonLdObject } from "./models";

// The page-node vocabulary this module's builders share with the graph assemblers
export type PageNodeType = "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";

interface ArticleNodeInput {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly keywords: ReadonlyArray<string>;
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
  readonly hasPart?: JsonLdNodes;
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
  readonly relatedLinks?: ReadonlyArray<string>;
}

// constants
import { HOME_URL, PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "./site";

// Strip undefined properties so JSON-LD nodes never publish unset optional keys
const definedNode = <T extends JsonLdObject>(node: T): JsonLdNode => Record.filter(node, Predicate.isNotUndefined);

export const articleNode = ({ id, headline, description, preferredLanguage, keywords, about, mainEntityOfPage, image }: ArticleNodeInput): JsonLdNode =>
  definedNode({
    "@type": "Article",
    "@id": id,
    headline,
    description,
    inLanguage: preferredLanguage,
    keywords: Array.join(keywords, ", "),
    url: mainEntityOfPage,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PUBLISHER_ID },
    about: { "@id": about },
    mainEntityOfPage: { "@id": mainEntityOfPage },
    image,
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
  hasPart,
}: WebPageNodeInput): JsonLdNode =>
  definedNode({
    "@type": type,
    "@id": id,
    url,
    name,
    description,
    inLanguage: preferredLanguage,
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: hasBreadcrumb ? { "@id": `${id}#breadcrumb` } : undefined,
    mainEntity,
    primaryImageOfPage,
    hasPart: hasPart !== undefined && hasPart.length > 0 ? hasPart : undefined,
  });

export const collectionNode = ({ id, name, preferredLanguage, parts, url }: CollectionNodeInput): JsonLdNode =>
  definedNode({
    "@type": "Collection",
    "@id": id,
    url,
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

// Builds an EmployeeRole for employment or SoftwareSourceCode/CreativeWork for projects
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
  relatedLinks,
}: ExperienceItemNodeInput): JsonLdNode =>
  Match.value(employment).pipe(
    Match.when(true, () => ({
      // EmployeeRole describes employment without implying that a historical role is current
      "@type": "EmployeeRole",
      "@id": id,
      roleName: role,
      description,
      member: { "@id": PERSON_ID },
      mainEntityOfPage: { "@id": url },
    })),
    Match.when(false, () =>
      definedNode({
        "@type": repository === undefined ? "CreativeWork" : "SoftwareSourceCode",
        "@id": id,
        name: role,
        description,
        image,
        url,
        mainEntityOfPage: { "@id": url },
        inLanguage: preferredLanguage,
        creator: { "@id": PERSON_ID },
        publisher: { "@id": PUBLISHER_ID },
        // The same join the Markdown twin's `skills` fact publishes, so the two spellings cannot drift
        keywords: Array.join(keywords, ", "),
        codeRepository: repository,
        relatedLink: relatedLinks !== undefined && relatedLinks.length > 0 ? relatedLinks : undefined,
      })
    ),
    Match.exhaustive
  );

// Extends the site Person entity with an additional edge during graph merging
export const personEdge = (fields: JsonLdObject): JsonLdNode => ({
  "@type": "Person",
  "@id": PERSON_ID,
  ...fields,
});

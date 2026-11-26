// services, features, and other libraries
import { Array, Match, Option, Predicate, Record, pipe } from "effect";
import { matchPreferredLanguage } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { ExperienceSection, JsonLdNode, JsonLdNodes, JsonLdObject } from "./models";

// The page-node vocabulary this module's builders share with the graph assemblers
export type PageNodeType = "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";

interface ArticleNodeInput {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly articleBody?: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly keywords: ReadonlyArray<string>;
  readonly articleSection?: ExperienceSection;
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
  readonly relatedLinks?: ReadonlyArray<string>;
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
import { SITE_LANGUAGES } from "@/domain/constants";
import { HOME_URL, PERSON_ID, PUBLISHER_ID, WEBSITE_ID } from "./site";

// Strip undefined properties so JSON-LD nodes never publish unset optional keys
export const definedNode = <T extends JsonLdObject>(node: T): JsonLdNode => Record.filter(node, Predicate.isNotUndefined);

const nonEmptyItems = <A>(items: ReadonlyArray<A> | undefined): Option.Option<Array.NonEmptyReadonlyArray<A>> =>
  pipe(Option.fromUndefinedOr(items), Option.filter(Array.isReadonlyArrayNonEmpty));

// Converts undefined or empty arrays to undefined so JSON-LD nodes omit empty relation lists
const nonEmptyOrUndefined = <A>(items: ReadonlyArray<A> | undefined): ReadonlyArray<A> | undefined => Option.getOrUndefined(nonEmptyItems(items));

// Schema.org keywords is a comma-separated text field; an empty list must vanish, not publish ""
const keywordsText = (keywords: ReadonlyArray<string>): string | undefined =>
  pipe(nonEmptyItems(keywords), Option.map(Array.join(", ")), Option.getOrUndefined);

export const articleNode = ({
  id,
  headline,
  description,
  articleBody,
  preferredLanguage,
  keywords,
  articleSection,
  about,
  mainEntityOfPage,
  image,
}: ArticleNodeInput): JsonLdNode =>
  definedNode({
    "@type": "Article",
    "@id": id,
    headline,
    description,
    articleBody,
    inLanguage: preferredLanguage,
    keywords: keywordsText(keywords),
    articleSection,
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
  relatedLinks,
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
    hasPart: nonEmptyOrUndefined(hasPart),
    relatedLink: nonEmptyOrUndefined(relatedLinks),
  });

export const collectionNode = ({ id, name, preferredLanguage, parts, url }: CollectionNodeInput): JsonLdNode =>
  definedNode({
    "@type": "Collection",
    "@id": id,
    url,
    name,
    inLanguage: preferredLanguage,
    // Same empty-list omission as webPageNode, so no builder publishes a redundant `hasPart: []`
    hasPart: nonEmptyOrUndefined(parts),
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
        "@type": Predicate.isUndefined(repository) ? "CreativeWork" : "SoftwareSourceCode",
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
        keywords: keywordsText(keywords),
        codeRepository: repository,
      })
    ),
    Match.exhaustive
  );

// Extends the site Person without allowing edge data to redirect the shared entity's identity
export const personEdge = (fields: JsonLdObject): JsonLdNode => ({
  ...fields,
  "@type": "Person",
  "@id": PERSON_ID,
});

export const educationalOrganizationNode = ({
  id,
  name,
  description,
  address,
}: {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly address: string;
}): JsonLdNode => ({
  "@type": "EducationalOrganization",
  "@id": id,
  name,
  description,
  address,
  alumni: { "@id": PERSON_ID },
});

export const employerOrganizationNode = (id: string, name: string, memberId: string): JsonLdNode => ({
  "@type": "Organization",
  "@id": id,
  name,
  member: { "@id": memberId },
});

export const contactPointNode = (id: string, url: string, email?: string): JsonLdNode =>
  definedNode({
    "@type": "ContactPoint",
    "@id": id,
    contactType: "author",
    url,
    email,
    availableLanguage: [...SITE_LANGUAGES],
  });

export const collectionPartNode = (canonical: string, name: string): JsonLdNode => ({
  "@type": "WebPage",
  "@id": canonical,
  url: canonical,
  name,
});

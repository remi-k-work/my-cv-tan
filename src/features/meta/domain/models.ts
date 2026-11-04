// Strongly-typed head metadata, structured data, and route head contracts.

// types
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain/models";

// --- HTML Head & Link Tags ---

// Discriminated union of valid <meta> tags.
export type MetaTag =
  | { readonly charSet: "utf-8" }
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

// Valid attributes for <link> tags emitted by head builders and RFC 8288 Link headers.
export interface LinkTag {
  readonly rel: string;
  readonly href: string;
  readonly type?: string;
  readonly title?: string;
  readonly hreflang?: string;
}

// Structured data script tag for JSON-LD graphs.
export interface JsonLdScript {
  readonly type: "application/ld+json";
  readonly children: string;
}

// Head elements consumed by TanStack Router route head() functions.
export interface PageHead {
  readonly meta: Array<MetaTag>;
  readonly links: Array<LinkTag>;
  readonly scripts: Array<JsonLdScript>;
}

// TanStack route head match chain providing loader data.
export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown }>;

// Verified facts about a published image file.
export interface SocialImageFacts {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

// Image facts paired with alt text describing the specific card picture.
export interface SocialImage extends SocialImageFacts {
  readonly alt: string;
}

// Input for OpenGraph and Twitter social card tags.
export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: "employment" | "portfolio";
}

// Full specification for constructing an indexable page head.
export interface PageHeadSpec extends SocialMetaInput {
  readonly markdownPath: string;
  readonly graph: JsonLdNodes;
  readonly authorHref?: string;
}

// Input for experience detail page head builder.
export interface ExperienceHeadInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}

// Input for static page head builders.
export interface StaticPageHeadInput {
  readonly pageTitles: PageTitles;
  readonly preferredLanguage: PreferredLanguage;
}

// --- Static Page Copy ---

export type StaticPageType = "overview" | "education" | "contact";

export interface LocalizedCopy {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}

export interface StaticPageCopySource {
  readonly heading: string;
  readonly intro: string;
  readonly title: string;
  readonly description: string;
}

export interface StaticPageCopy extends LocalizedCopy {
  readonly path: PagePath;
  readonly mdHref: string;
  readonly type: StaticPageType;
  readonly seoTitle: string;
  readonly intro: string;
  readonly canonical: string;
}

export interface StaticPageSettings {
  readonly mdHref: string;
  readonly label: string;
  readonly type: StaticPageType;
  readonly copy: Readonly<Record<PreferredLanguage, StaticPageCopySource>>;
}

// --- JSON-LD Structured Data ---

export interface JsonLdNode {
  readonly "@type"?: string;
  readonly "@id"?: string;
  readonly [property: string]: unknown;
}

export type JsonLdNodes = ReadonlyArray<JsonLdNode>;

export type PageNodeType = "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";

export interface ArticleNodeInput {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly datePublished?: string;
  readonly mainEntityOfPage?: string;
}

export interface WebPageNodeInput {
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

export interface CollectionNodeInput {
  readonly id: string;
  readonly name: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly parts: ReadonlyArray<unknown>;
  readonly url?: string;
}

export type SubPageInput = Omit<WebPageNodeInput, "id" | "url" | "breadcrumb"> & { readonly path: string };

export interface HomeJsonLdInput extends LocalizedCopy {
  readonly experienceList: ExperienceList;
}

export interface EducationJsonLdInput extends LocalizedCopy {
  readonly educationList: EducationList;
}

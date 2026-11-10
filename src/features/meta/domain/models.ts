// services, features, and other libraries
import { Option } from "effect";

// types
import type { PagePath, PageTitles, PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";

export type MetaTag =
  | { readonly charSet: "utf-8" }
  | { readonly title: string }
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

export interface LinkTag {
  readonly rel: string;
  readonly href: string;
  readonly type?: string;
  readonly title?: string;
  readonly hreflang?: string;
}

export interface JsonLdScript {
  readonly type: "application/ld+json";
  readonly children: string;
}

type JsonLdValue = string | number | boolean | null | JsonLdObject | ReadonlyArray<JsonLdValue>;

export interface JsonLdObject {
  readonly [property: string]: JsonLdValue | undefined;
}

export interface JsonLdNode extends JsonLdObject {
  readonly "@type"?: string;
  readonly "@id"?: string;
}

export type JsonLdNodes = ReadonlyArray<JsonLdNode>;

// Flat head elements consumed by TanStack Router route head() functions.
export interface PageHead {
  readonly meta: Array<MetaTag>;
  readonly links: Array<LinkTag>;
  readonly scripts: Array<JsonLdScript>;
}

export interface SocialImageFacts {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

export interface ExperienceHeadInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}

export interface ExperienceSeo extends ExperienceHeadInput {
  readonly path: string;
  readonly canonical: string;
  readonly markdownPath: string;
  readonly headline: string;
  readonly description: string;
  readonly screenshot: Option.Option<SocialImageFacts>;
}

export type ExperienceGraphInput = Omit<ExperienceSeo, "canonical" | "markdownPath">;

export interface DegradedCopy {
  readonly title: string;
  readonly description: string;
}

export type PageNodeType = "WebPage" | "ContactPage" | "CollectionPage" | "ProfilePage";

export interface ArticleNodeInput {
  readonly id: string;
  readonly headline: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly about: string;
  readonly mainEntityOfPage: string;
  readonly image?: JsonLdNode;
}

export interface WebPageNodeInput {
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

export interface CollectionNodeInput {
  readonly id: string;
  readonly name: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly parts: ReadonlyArray<JsonLdNode>;
  readonly url?: string;
}

export interface ExperienceItemNodeInput {
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

export interface PageGraphSpec {
  readonly type: PageNodeType;
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
  readonly mainEntity?: JsonLdNode;
  readonly primaryImageOfPage?: JsonLdNode;
}

export interface StaticPageHeadInput {
  readonly pageTitles: PageTitles;
  readonly preferredLanguage: PreferredLanguage;
}

export interface PageHeadSpec {
  readonly social: SocialMetaInput;
  readonly markdownPath: string;
  readonly graph: JsonLdNodes;
}

export type StaticPageType = "overview" | "education" | "contact";

export interface LocalizedCopy {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}

export interface StaticPageCopy extends LocalizedCopy {
  readonly path: PagePath;
  readonly mdHref: string;
  readonly type: StaticPageType;
  readonly seoTitle: string;
  readonly intro: string;
  readonly canonical: string;
}

export interface StaticPageCopySource {
  readonly heading: string;
  readonly intro: string;
  readonly title: string;
  readonly description: string;
}

export interface StaticPageSettings {
  readonly mdHref: string;
  readonly label: string;
  readonly type: StaticPageType;
  readonly indexSummary: string;
  readonly copy: Readonly<Record<PreferredLanguage, StaticPageCopySource>>;
}

export type RouteStatus = "pending" | "success" | "error" | "notFound";

export type MatchChain = ReadonlyArray<{ readonly loaderData?: unknown; readonly status?: RouteStatus; readonly _notFound?: boolean }>;

export interface RootHead {
  readonly meta: ReadonlyArray<MetaTag>;
  readonly links: ReadonlyArray<LinkTag>;
}

export interface RouteHeadSpec<TData> {
  readonly loaderData: TData;
  readonly matches: MatchChain;
  readonly matchStatus: RouteStatus;
  readonly fallbackPath: string;
  readonly build: (loaderData: NonNullable<TData>, preferredLanguage: PreferredLanguage) => PageHead;
}

export interface SocialImage extends SocialImageFacts {
  readonly alt: string;
}

export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly ogType?: "website" | "article";
  readonly articleSection?: "employment" | "portfolio";
}

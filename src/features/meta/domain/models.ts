// types
import type { EducationList } from "@/features/education/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";
import type { PageTitles, PagePath, PreferredLanguage } from "@/domain/models";

// A share image with verified facts: scrapers get the real type and dimensions, never guesses
export interface SocialImage {
  readonly src: string;
  readonly mime: "image/jpeg" | "image/webp";
  readonly width: number;
  readonly height: number;
}

// og:type stays fixed to "website" in social.ts: the site has no article-like pages
export interface SocialMetaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly image: SocialImage;
  readonly preferredLanguage: PreferredLanguage;
  readonly twitterImage?: SocialImage;
}

// One <script type="application/ld+json"> tag carrying a schema.org @graph
export interface JsonLdScript {
  readonly type: "application/ld+json";
  readonly children: string;
}

// Visible page name and summary shared by its JSON-LD node and breadcrumb
export interface LocalizedCopy {
  readonly pageName: string;
  readonly description: string;
  readonly preferredLanguage: PreferredLanguage;
}

export type StaticPageType = "overview" | "education" | "contact";

// Resolved static-page copy: visible copy plus authored search metadata. Heads and
// Markdown twins both consume this, so the HTML and .md documents cannot drift apart.
export interface StaticPageCopy extends LocalizedCopy {
  readonly path: PagePath;
  readonly mdHref: string;
  readonly type: StaticPageType;
  // Search and share title is authored separately from the longer body heading
  readonly seoTitle: string;
  readonly intro: string;
  readonly canonical: string;
}

// Page heads take the locale resolved from the root match (see language.ts)
export interface PageHeadInput {
  readonly pageTitles: PageTitles;
  readonly preferredLanguage: PreferredLanguage;
}

// pagePath selects the STATIC_PAGES entry (twin href + fallback copy); the page supplies
// its own JSON-LD builder, which closes over the page-specific data and is fed the resolved copy
export interface StaticPageHeadInput extends PageHeadInput {
  readonly pagePath: PagePath;
  readonly jsonLd: (copy: LocalizedCopy) => JsonLdScript;
}

export interface HomeHeadInput extends PageHeadInput {
  readonly experienceList: ExperienceList;
}

export interface EducationHeadInput extends PageHeadInput {
  readonly educationList: EducationList;
}

// The loader matches the URL slug against experience.slug, so the data slug alone drives
// every canonical, social and JSON-LD URL; the two can never drift apart
export interface ExperienceHeadInput {
  readonly experience: Experience;
  readonly preferredLanguage: PreferredLanguage;
}

// JSON-LD graph inputs: the localized copy plus the dataset each page renders from
export interface HomeJsonLdInput extends LocalizedCopy {
  readonly experienceList: ExperienceList;
}

export interface EducationJsonLdInput extends LocalizedCopy {
  readonly educationList: EducationList;
}

interface PageMetadata {
  readonly title: string;
  readonly description: string;
}

export interface StaticPageSettings {
  readonly mdHref: string;
  readonly type: StaticPageType;
  readonly fallbackHeading: string;
  readonly fallbackIntro: string;
  readonly metadata: Readonly<Record<PreferredLanguage, PageMetadata>>;
}

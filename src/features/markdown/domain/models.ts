// services, features, and other libraries
import { translateSource } from "@/domain/helpers";

// types
import type { PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { StaticPageCopy } from "@/features/meta/domain/models";

// constants
import { CONTACT_PATH, DEFAULT_LANGUAGE, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { BRANDED_TITLE, SITE_NAME } from "@/features/meta/domain/site";

// A Markdown twin consists of structured frontmatter facts and a markdown body
export interface MarkdownTwin {
  readonly facts: Readonly<Record<string, string>>;
  readonly body: string;
}

// Everything a twin builder needs to resolve copy for one reader
export interface TwinContext {
  readonly preferredLanguage: PreferredLanguage;
  readonly translate: Translate;
  // Aggregated documents own discovery links, so embedded twins omit their repeated navigation
  readonly includeNavigation?: boolean;
}

export interface PageContent {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
  readonly educationList: EducationList;
}

export interface PageDocumentContent {
  readonly [HOME_PATH]: Pick<PageContent, "pageTitles" | "experienceList">;
  readonly [EDUCATION_PATH]: Pick<PageContent, "pageTitles" | "educationList">;
  readonly [CONTACT_PATH]: Pick<PageContent, "pageTitles">;
}

// The source-language context every English-only surface (llms.txt, llms-full.txt) renders with
export const SOURCE_CONTEXT = { preferredLanguage: DEFAULT_LANGUAGE, translate: translateSource } as const satisfies TwinContext;

// Even a 404 carries the site's identity, but only a real page may add a canonical or type
export const twinBaseFacts = (title: string, description: string, preferredLanguage: PreferredLanguage) =>
  ({
    title: BRANDED_TITLE(title),
    description,
    author: SITE_NAME,
    lang: preferredLanguage,
  }) as const;

// The identity facts every published twin shares with its HTML head
export const twinIdentity = (title: string, description: string, canonical: string, preferredLanguage: PreferredLanguage) => ({
  ...twinBaseFacts(title, description, preferredLanguage),
  canonical,
});

export const pageFacts = ({ seoTitle, description, canonical, preferredLanguage, type }: StaticPageCopy) => ({
  ...twinIdentity(seoTitle, description, canonical, preferredLanguage),
  type,
});

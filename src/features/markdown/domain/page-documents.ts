// The page-to-document mapping shared by individual twins and llms-full.txt. Data loading stays in
// the service layer; this module only connects each catalogue page to its pure builder.

// services, features, and other libraries
import { buildContactMd, buildEducationMd, buildHomeMd } from "./twins";

// types
import type { PagePath, PageTitles } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { MarkdownTwin, TwinContext } from "./models";

export interface PageContent {
  readonly pageTitles: PageTitles;
  readonly experienceList: ExperienceList;
  readonly educationList: EducationList;
}

interface PageDocumentContent {
  readonly [HOME_PATH]: Pick<PageContent, "pageTitles" | "experienceList">;
  readonly [EDUCATION_PATH]: Pick<PageContent, "pageTitles" | "educationList">;
  readonly [CONTACT_PATH]: Pick<PageContent, "pageTitles">;
}

type PageDocumentBuilder<P extends PagePath> = (content: PageDocumentContent[P], context: TwinContext) => MarkdownTwin;

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";

const PAGE_DOCUMENT_BUILDERS: { readonly [P in PagePath]: PageDocumentBuilder<P> } = {
  [HOME_PATH]: (content, context) => buildHomeMd({ ...content, ...context }),
  [EDUCATION_PATH]: (content, context) => buildEducationMd({ ...content, ...context }),
  [CONTACT_PATH]: (content, context) => buildContactMd({ ...content, ...context }),
};

export const buildPageDocument = <P extends PagePath>(pagePath: P, content: PageDocumentContent[P], context: TwinContext): MarkdownTwin =>
  PAGE_DOCUMENT_BUILDERS[pagePath](content, context);

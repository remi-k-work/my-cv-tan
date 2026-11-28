// services, features, and other libraries
import { Effect } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { pageEntry } from "@/features/markdown/domain/catalogue";
import { buildPageDocument } from "@/features/markdown/domain/twins";

// types
import type { PagePath, PreferredLanguage } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { IndexEntry } from "@/features/markdown/domain/catalogue";
import type { MarkdownTwin, PageDocumentContent, TwinContext } from "@/features/markdown/domain/models";

interface PageTwin {
  readonly entry: IndexEntry;
  readonly document: (datasets: Datasets["Service"], context: TwinContext) => Effect.Effect<MarkdownTwin, RequiredDataError>;
}

type LoadPageContent<P extends PagePath> = (
  datasets: Datasets["Service"],
  preferredLanguage: PreferredLanguage
) => Effect.Effect<PageDocumentContent[P], RequiredDataError>;

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";

// One pipeline owns catalogue lookup, dataset loading, tracing and pure rendering for every page
const pageTwin = <P extends PagePath>(pagePath: P, load: LoadPageContent<P>): PageTwin => ({
  entry: pageEntry(pagePath),
  document: Effect.fn("Markdown.page")(function* (datasets: Datasets["Service"], context: TwinContext) {
    const content = yield* load(datasets, context.preferredLanguage);
    return buildPageDocument(pagePath, content, context);
  }),
});

// Exhaustive over PagePath; each entry declares only the datasets its pure builder actually reads
export const PAGE_TWINS = {
  [HOME_PATH]: pageTwin(HOME_PATH, (datasets, preferredLanguage) =>
    Effect.map(datasets.experienceList(preferredLanguage), (experienceList) => ({ experienceList }))
  ),
  [EDUCATION_PATH]: pageTwin(EDUCATION_PATH, (datasets, preferredLanguage) =>
    Effect.map(datasets.educationList(preferredLanguage), (educationList) => ({ educationList }))
  ),
  [CONTACT_PATH]: pageTwin(CONTACT_PATH, () => Effect.succeed({})),
} satisfies Record<PagePath, PageTwin>;

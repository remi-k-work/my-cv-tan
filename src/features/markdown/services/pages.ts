// services, features, and other libraries
import { Effect, Record } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { pageEntry } from "@/features/markdown/domain/catalogue";
import { buildPageDocument } from "@/features/markdown/domain/page-documents";

// types
import type { PagePath } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";
import type { IndexEntry } from "@/features/markdown/domain/catalogue";
import type { MarkdownTwin, TwinContext } from "@/features/markdown/domain/models";

export interface PageTwin {
  readonly entry: IndexEntry;
  readonly document: (context: TwinContext) => Effect.Effect<MarkdownTwin, RequiredDataError, Datasets>;
}

// constants
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";

const pageTwin = (pagePath: PagePath, document: PageTwin["document"]): PageTwin => ({ entry: pageEntry(pagePath), document });

const homeDocument = Effect.fnUntraced(function* ({ preferredLanguage, translate }: TwinContext) {
  const datasets = yield* Datasets;
  const data = yield* Effect.all(
    { pageTitles: datasets.pageTitles(preferredLanguage), experienceList: datasets.experienceList(preferredLanguage) },
    { concurrency: "unbounded" }
  );

  return buildPageDocument(HOME_PATH, data, { preferredLanguage, translate });
});

const educationDocument = Effect.fnUntraced(function* ({ preferredLanguage, translate }: TwinContext) {
  const datasets = yield* Datasets;
  const data = yield* Effect.all(
    { pageTitles: datasets.pageTitles(preferredLanguage), educationList: datasets.educationList(preferredLanguage) },
    { concurrency: "unbounded" }
  );

  return buildPageDocument(EDUCATION_PATH, data, { preferredLanguage, translate });
});

const contactDocument = Effect.fnUntraced(function* ({ preferredLanguage, translate }: TwinContext) {
  const datasets = yield* Datasets;
  const pageTitles = yield* datasets.pageTitles(preferredLanguage);

  return buildPageDocument(CONTACT_PATH, { pageTitles }, { preferredLanguage, translate });
});

const PAGE_DOCUMENTS = { [HOME_PATH]: homeDocument, [EDUCATION_PATH]: educationDocument, [CONTACT_PATH]: contactDocument } satisfies Record<
  PagePath,
  PageTwin["document"]
>;

// Exhaustive over PagePath: adding a page requires its data pipeline and shared pure builder
export const PAGE_TWINS: Record<PagePath, PageTwin> = Record.map(PAGE_DOCUMENTS, (document, pagePath) => pageTwin(pagePath, document));

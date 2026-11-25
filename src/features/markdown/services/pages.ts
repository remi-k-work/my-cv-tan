// services, features, and other libraries
import { Effect } from "effect";
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

const homeDocument = Effect.fn("Markdown.page.home")(function* ({ preferredLanguage, translate }: TwinContext) {
  const datasets = yield* Datasets;
  const data = yield* Effect.all(
    { pageTitles: datasets.pageTitles(preferredLanguage), experienceList: datasets.experienceList(preferredLanguage) },
    { concurrency: "unbounded" }
  );

  return buildPageDocument(HOME_PATH, data, { preferredLanguage, translate });
});

const educationDocument = Effect.fn("Markdown.page.education")(function* ({ preferredLanguage, translate }: TwinContext) {
  const datasets = yield* Datasets;
  const data = yield* Effect.all(
    { pageTitles: datasets.pageTitles(preferredLanguage), educationList: datasets.educationList(preferredLanguage) },
    { concurrency: "unbounded" }
  );

  return buildPageDocument(EDUCATION_PATH, data, { preferredLanguage, translate });
});

const contactDocument = Effect.fn("Markdown.page.contact")(function* ({ preferredLanguage, translate }: TwinContext) {
  const datasets = yield* Datasets;
  const pageTitles = yield* datasets.pageTitles(preferredLanguage);

  return buildPageDocument(CONTACT_PATH, { pageTitles }, { preferredLanguage, translate });
});

// Exhaustive over PagePath: each page owns its data pipeline, catalogue entry and shared pure builder
export const PAGE_TWINS = {
  [HOME_PATH]: { entry: pageEntry(HOME_PATH), document: homeDocument },
  [EDUCATION_PATH]: { entry: pageEntry(EDUCATION_PATH), document: educationDocument },
  [CONTACT_PATH]: { entry: pageEntry(CONTACT_PATH), document: contactDocument },
} satisfies Record<PagePath, PageTwin>;

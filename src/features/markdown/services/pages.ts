// services, features, and other libraries
import { Effect } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { pageEntry } from "@/features/markdown/domain/catalogue";
import { buildContactMd, buildEducationMd, buildHomeMd } from "@/features/markdown/domain/twins";

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

const homeTwin = pageTwin(HOME_PATH, ({ preferredLanguage, translate }) =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;
    const data = yield* Effect.all(
      { pageTitles: datasets.pageTitles(preferredLanguage), experienceList: datasets.experienceList(preferredLanguage) },
      { concurrency: "unbounded" }
    );

    return buildHomeMd({ ...data, preferredLanguage, translate });
  })
);

const educationTwin = pageTwin(EDUCATION_PATH, ({ preferredLanguage, translate }) =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;
    const data = yield* Effect.all(
      { pageTitles: datasets.pageTitles(preferredLanguage), educationList: datasets.educationList(preferredLanguage) },
      { concurrency: "unbounded" }
    );

    return buildEducationMd({ ...data, preferredLanguage, translate });
  })
);

const contactTwin = pageTwin(CONTACT_PATH, ({ preferredLanguage, translate }) =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;
    const pageTitles = yield* datasets.pageTitles(preferredLanguage);

    return buildContactMd({ pageTitles, preferredLanguage, translate });
  })
);

// Exhaustive over PagePath: adding a page is a compile error until its document pipeline exists
export const PAGE_TWINS: Record<PagePath, PageTwin> = { [HOME_PATH]: homeTwin, [EDUCATION_PATH]: educationTwin, [CONTACT_PATH]: contactTwin };

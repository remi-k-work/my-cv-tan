// Datasets service providing localized portfolio data accessors with failure tracking.

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { requireDataFrom } from "@/features/data/domain/required";
import { Data } from "@/features/data/services/data";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PageTitles, PreferredLanguage } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";

// Localized dataset accessor returning required data or RequiredDataError.
export type LocalizedAccessor<Value> = (preferredLanguage: PreferredLanguage) => Effect.Effect<Value, RequiredDataError>;

// Service contract for localized data accessors used by discovery documents.
export type DatasetsService = {
  readonly pageTitles: LocalizedAccessor<PageTitles>;
  readonly experienceList: LocalizedAccessor<ExperienceList>;
  readonly educationList: LocalizedAccessor<EducationList>;
};

// Wraps an optional data accessor into a required effect pinned to a language.
const localizedDataset =
  <Value>(dataset: string, accessor: (preferredLanguage: Option.Option<PreferredLanguage>) => Effect.Effect<Option.Option<Value>>): LocalizedAccessor<Value> =>
  (preferredLanguage) =>
    requireDataFrom(accessor(Option.some(preferredLanguage)), dataset);

export class Datasets extends Context.Service<Datasets>()("Datasets", {
  make: Effect.gen(function* () {
    const data = yield* Data;

    return {
      pageTitles: localizedDataset("page titles", (preferredLanguage) => data.stablePageTitles(preferredLanguage)),
      experienceList: localizedDataset("experience list", (preferredLanguage) => data.experienceList(preferredLanguage)),
      educationList: localizedDataset("education list", (preferredLanguage) => data.educationList(preferredLanguage)),
    } as const;
  }),
}) {
  // Layer providing Data dependency internally so consumers receive requirement-free accessors.
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Data.layer));
}

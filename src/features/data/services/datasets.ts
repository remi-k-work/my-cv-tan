// Localized, required dataset accessors for machine-readable documents.

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { requireDataFrom } from "@/features/data/domain/required";
import { Data } from "@/features/data/services/data";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PageTitles, PreferredLanguage } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";

export type LocalizedAccessor<Value> = (preferredLanguage: PreferredLanguage) => Effect.Effect<Value, RequiredDataError>;

export type DatasetsService = {
  readonly pageTitles: LocalizedAccessor<PageTitles>;
  readonly experienceList: LocalizedAccessor<ExperienceList>;
  readonly educationList: LocalizedAccessor<EducationList>;
};

const localizedDataset =
  <Value>(dataset: string, accessor: (preferredLanguage: Option.Option<PreferredLanguage>) => Effect.Effect<Option.Option<Value>>) =>
  (preferredLanguage: PreferredLanguage) =>
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
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Data.layer));
}

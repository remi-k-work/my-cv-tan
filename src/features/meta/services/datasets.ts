// --- The Datasets service ---
//
// One localized dataset lookup for an already-resolved language: fetch the asset, then require it —
// a missing or failed decode becomes a named failure that the shared 503 recovery reports precisely.
//
// Lives in meta because it is the binding both document builders already depend on: the sitemap
// service and the Markdown twins pin datasets to a language the same way, from one binding.

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { requireDataFrom } from "@/features/data/domain/required";
import { Data } from "@/features/data/services/data";

// types
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";
import type { PageTitles, PreferredLanguage } from "@/domain/models";
import type { RequiredDataError } from "@/features/data/domain/required";

// One localized dataset lookup for an already-resolved language: fetch the asset, then require it —
// a missing or failed decode becomes a named failure that the shared 503 recovery reports precisely.
export type LocalizedAccessor<Value> = (preferredLanguage: PreferredLanguage) => Effect.Effect<Value, RequiredDataError>;

// The service shape every document pipeline resolves: three named accessors, one per portfolio
// asset, each already pinned to the language the request pipeline chose.
export type DatasetsService = {
  // Stable page copy: the HTML head resolves the same values, so a twin's frontmatter and the
  // page's <head> meta cannot drift apart
  readonly pageTitles: LocalizedAccessor<PageTitles>;
  // The portfolio datasets the home and detail twins render, in the request's language
  readonly experienceList: LocalizedAccessor<ExperienceList>;
  readonly educationList: LocalizedAccessor<EducationList>;
};

// Pins a Data accessor (which negotiates its own language) to the language the request pipeline
// already resolved, so a document never re-decides the language on a second lookup.
//
// The accessor receives `Option.some(preferredLanguage)` because the Data service's accessors
// accept `Option<PreferredLanguage>` and resolve the locale through `requestPreferredLanguage`;
// pinning here means a document never re-negotiates the language on a second lookup.
const localizedDataset =
  <Value>(dataset: string, accessor: (preferredLanguage: Option.Option<PreferredLanguage>) => Effect.Effect<Option.Option<Value>>): LocalizedAccessor<Value> =>
  (preferredLanguage) =>
    requireDataFrom(accessor(Option.some(preferredLanguage)), dataset);

// Binds the accessors to one resolved Data service. A document builder resolves the service once
// and reads these, so every document it returns is a pure function of its request.
//
// A service rather than a factory call at each consumer: the sitemap, the twins and the two AI
// indexes all need the same binding, and a layer means it is constructed once and provided once
// instead of each feature re-deriving it from `Data` and re-wiring its recovery.
export class Datasets extends Context.Service<Datasets>()("Datasets", {
  make: Effect.fn("Datasets.make")(function* () {
    const data = yield* Data;
    return {
      pageTitles: localizedDataset("page titles", (preferredLanguage) => data.stablePageTitles(preferredLanguage)),
      experienceList: localizedDataset("experience list", (preferredLanguage) => data.experienceList(preferredLanguage)),
      educationList: localizedDataset("education list", (preferredLanguage) => data.educationList(preferredLanguage)),
    };
  }),
}) {
  // `make` reads the in-memory Data service once; providing it here keeps that dependency internal
  // to the layer while the returned documents stay requirement-free.
  static readonly layer = Layer.effect(this, this.make()).pipe(Layer.provide(Data.layer));
}

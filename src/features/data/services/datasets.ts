// Localized, required dataset accessors for machine-readable documents.

// services, features, and other libraries
import { Context, Effect, Layer, Option } from "effect";
import { requireDataFrom } from "@/features/data/domain/required";
import { Data } from "@/features/data/services/data";

// types
import type { PreferredLanguage } from "@/domain/models";

// Every accessor resolves one language itself, so a document pipeline reads the dataset for the
// reader it was built for instead of negotiating a language on its own
const localizedDataset =
  <Value>(dataset: string, accessor: (preferredLanguage: Option.Option<PreferredLanguage>) => Effect.Effect<Option.Option<Value>>) =>
  (preferredLanguage: PreferredLanguage) =>
    requireDataFrom(accessor(Option.some(preferredLanguage)), dataset);

export class Datasets extends Context.Service<Datasets>()("Datasets", {
  // The accessors are pure projections of Data's already-shaped methods, so the layer is a map
  // over the service rather than a generator body that yields it once
  make: Effect.map(
    Data,
    (data) =>
      ({
        pageTitles: localizedDataset("page titles", data.stablePageTitles),
        experienceList: localizedDataset("experience list", data.experienceList),
        educationList: localizedDataset("education list", data.educationList),
      }) as const
  ),
}) {
  // `provideMerge` rather than `provide`: Data is a published layer of its own, so the composition
  // itself states that both readers share one instance instead of leaving that to the runtime's
  // memo map — `Layer.provide` would keep `Data` private to this layer and silently rely on the
  // caller rebuilding it from `Data.layer` and being memoized into the same instance
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provideMerge(Data.layer));
}

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Datasets } from "../datasets";
import { Data } from "@/features/data/services/data";

// types
import type { RequiredDataError } from "@/features/data/domain/required";

// A Data service whose every asset is unavailable, so the accessors' failure path is exercised
// without touching the real portfolio assets
const MissingData = Layer.succeed(
  Data,
  Data.of({
    randomPageTitles: () => Effect.succeedNone,
    stablePageTitles: () => Effect.succeedNone,
    experienceList: () => Effect.succeedNone,
    educationList: () => Effect.succeedNone,
    experience: () => Effect.succeedNone,
  })
);

it.effect("the service binds one localized accessor per portfolio asset by name", () =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;

    const titles = yield* datasets.pageTitles("en");
    const experienceList = yield* datasets.experienceList("pl");
    const educationList = yield* datasets.educationList("en");

    assert.isString(titles["/"].heading);
    assert.isArray(experienceList);
    assert.isArray(educationList);
  }).pipe(Effect.provide(Datasets.layer))
);

it.effect("every localized accessor reports the asset it could not read, by name", () =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;

    // The name is what the shared failure recovery logs and what the caller's fallback body
    // reports, so an accessor must carry its own asset rather than collapsing every one into an
    // anonymous failure; the mapping also pins each accessor to the asset it reads
    const reads: ReadonlyArray<readonly [string, Effect.Effect<void, RequiredDataError>]> = [
      ["page titles", datasets.pageTitles("en")],
      ["experience list", datasets.experienceList("pl")],
      ["education list", datasets.educationList("en")],
    ];

    yield* Effect.forEach(reads, ([dataset, read]) =>
      Effect.gen(function* () {
        const error = yield* Effect.flip(read);
        assert.strictEqual(error._tag, "RequiredDataError", dataset);
        assert.strictEqual(error.dataset, dataset);
        assert.include(error.message, dataset);
      })
    );
  }).pipe(Effect.provide(Layer.effect(Datasets, Datasets.make).pipe(Layer.provide(MissingData))))
);

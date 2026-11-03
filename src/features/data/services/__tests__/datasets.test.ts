// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { Datasets } from "../datasets";

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

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { Datasets } from "../services/datasets";

// The dataset accessors resolve everything through the Data service alone, so they run without
// the request context that language negotiation and the translation snapshot need.
it.effect("the service binds one localized accessor per portfolio asset by name", () =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;

    // An explicit language short-circuits negotiation, so the accessor picks the asset itself
    const titles = yield* datasets.pageTitles("en");
    const experienceList = yield* datasets.experienceList("pl");
    const educationList = yield* datasets.educationList("en");

    // The HTML head resolves the same stable copy the .md twins render, so a twin's frontmatter
    // and the page's <head> meta cannot drift apart
    assert.isString(titles["/"].heading);
    assert.isArray(experienceList);
    assert.isArray(educationList);
  }).pipe(Effect.provide(Datasets.layer))
);

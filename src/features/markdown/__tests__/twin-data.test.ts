// The service adapters resolve only the datasets each static Markdown twin declares.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { resolveContactTwinData, resolveEducationTwinData, resolveHomeTwinData } from "../services/twin-data";

it.effect("each static twin resolves only the datasets its body declares", () =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;

    const home = yield* resolveHomeTwinData(datasets, "en");
    assert.deepStrictEqual(Object.keys(home), ["pageTitles", "experienceList"]);

    const education = yield* resolveEducationTwinData(datasets, "en");
    assert.deepStrictEqual(Object.keys(education), ["pageTitles", "educationList"]);

    // The contact twin reads no portfolio data, so it resolves only the titles its heading needs
    // rather than the two lists it would discard
    const contact = yield* resolveContactTwinData(datasets, "en");
    assert.deepStrictEqual(Object.keys(contact), ["pageTitles"]);
  }).pipe(Effect.provide(Datasets.layer))
);

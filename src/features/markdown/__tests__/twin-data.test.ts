// The service adapters resolve only the datasets required by each static Markdown twin.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { resolveContactTwinData, resolveEducationTwinData, resolveHomeTwinData } from "../services/twin-data";

it.effect("each static twin resolves only the dataset its body declares", () =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;

    const home = yield* resolveHomeTwinData(datasets, "en");
    assert.deepStrictEqual(Object.keys(home), ["experienceList"]);

    const education = yield* resolveEducationTwinData(datasets, "en");
    assert.deepStrictEqual(Object.keys(education), ["educationList"]);

    const contact = yield* resolveContactTwinData(datasets, "en");
    assert.deepStrictEqual(contact, {});
  }).pipe(Effect.provide(Datasets.layer))
);

it("the contact twin has no dataset dependency", () => {
  const contact = Effect.runSync(resolveContactTwinData({} as Parameters<typeof resolveContactTwinData>[0], "en"));
  assert.deepStrictEqual(contact, {});
});

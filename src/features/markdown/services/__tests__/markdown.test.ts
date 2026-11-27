import { assert, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { RequiredDataError } from "@/features/data/domain/required";
import { HOME_PATH } from "@/domain/constants";
import { NOINDEX_FOLLOW } from "@/domain/http";
import { sampleExperience, stablePageTitles } from "@/features/markdown/__tests__/fixtures";
import { Markdown } from "../markdown";
import { Translation } from "../translation";

const failed = (dataset: string) => Effect.fail(new RequiredDataError({ dataset, message: `test outage: ${dataset}` }));

const unavailableDatasets = {
  pageTitles: () => failed("page titles"),
  experienceList: () => failed("experience list"),
  educationList: () => failed("education list"),
};

const availableDatasets = {
  pageTitles: () => Effect.succeed(stablePageTitles),
  experienceList: () => Effect.succeed([sampleExperience]),
  educationList: () => Effect.succeed([]),
};

const testLayer = (datasets: Datasets["Service"], translation = Translation.layer) =>
  Markdown.layer.pipe(Layer.provide(Layer.mergeAll(Layer.succeed(Datasets, datasets), translation)));

it.effect("Markdown.layer composes its translation and dataset dependencies", () =>
  Effect.gen(function* () {
    const markdown = yield* Markdown;
    const response = yield* markdown.page(HOME_PATH)(new Request("https://www.remiforge.dev/index.md?lang=en"));

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get("Content-Language"), "en");
    assert.include(yield* Effect.promise(() => response.text()), "Stable home title");
  }).pipe(Effect.provide(testLayer(availableDatasets)))
);

it.effect("Markdown.layer accepts an injected translation snapshot loader", () => {
  const translation = Translation.layerFrom(() => Effect.succeed(() => "Injected section"));

  return Effect.gen(function* () {
    const markdown = yield* Markdown;
    const response = yield* markdown.page(HOME_PATH)(new Request("https://www.remiforge.dev/index.md?lang=pl"));
    const body = yield* Effect.promise(() => response.text());

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get("Content-Language"), "pl");
    assert.include(body, 'lang: "pl"');
    assert.include(body, "## Injected section");
    assert.notInclude(body, "## Doświadczenie");
  }).pipe(Effect.provide(testLayer(availableDatasets, translation)));
});

it.effect("an unparseable experience address is a 404 without a fabricated location", () =>
  Effect.gen(function* () {
    const markdown = yield* Markdown;
    const response = yield* markdown.experience(new Request("https://www.remiforge.dev/parent/child.md?lang=en"));

    assert.strictEqual(response.status, 404);
    assert.strictEqual(response.headers.get("Content-Language"), "en");
    assert.strictEqual(response.headers.get("X-Robots-Tag"), NOINDEX_FOLLOW);
    assert.isNull(response.headers.get("Content-Location"));
    assert.include(yield* Effect.promise(() => response.text()), "No Markdown document exists for this address.");
  }).pipe(Effect.provide(testLayer(availableDatasets)))
);

it.effect("a pinned Polish outage keeps its body and representation metadata in Polish", () => {
  const translation = Translation.layerFrom(() =>
    Effect.succeed((source) => (source === "Content temporarily unavailable" ? "Treść chwilowo niedostępna" : source))
  );

  return Effect.gen(function* () {
    const markdown = yield* Markdown;
    const response = yield* markdown.page(HOME_PATH)(new Request("https://www.remiforge.dev/index.md?lang=pl"));
    const body = yield* Effect.promise(() => response.text());

    assert.strictEqual(response.status, 503);
    assert.strictEqual(response.headers.get("Content-Language"), "pl");
    assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=pl");
    assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
    assert.include(body, "# Treść chwilowo niedostępna");
  }).pipe(Effect.provide(testLayer(unavailableDatasets, translation)));
});

it.effect("Markdown page and experience documents recover required-data failures as fresh non-cacheable 503 responses", () =>
  Effect.gen(function* () {
    const markdown = yield* Markdown;
    const responses = [
      [yield* markdown.page(HOME_PATH)(new Request("https://www.remiforge.dev/index.md?lang=en")), "https://www.remiforge.dev/index.md?lang=en"],
      [yield* markdown.experience(new Request("https://www.remiforge.dev/sample-role.md?lang=en")), "https://www.remiforge.dev/sample-role.md?lang=en"],
    ] as const;

    for (const [response, contentLocation] of responses) {
      assert.strictEqual(response.status, 503);
      assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
      assert.strictEqual(response.headers.get("Content-Location"), contentLocation);
      assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
      assert.strictEqual(response.headers.get("Retry-After"), "300");
      assert.include(yield* Effect.promise(() => response.text()), "temporarily unavailable");
    }
  }).pipe(Effect.provide(testLayer(unavailableDatasets)))
);
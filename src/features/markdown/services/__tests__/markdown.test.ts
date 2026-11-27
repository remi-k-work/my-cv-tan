import { assert, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { RequiredDataError } from "@/features/data/domain/required";
import { HOME_PATH } from "@/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/domain/discovery";
import { CACHEABLE_HEADERS } from "@/lib/http-response";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/features/markdown/domain/indexes";
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

it.effect("Markdown AI indexes serve English source content with cacheable discovery envelopes", () =>
  Effect.gen(function* () {
    const markdown = yield* Markdown;
    // Neither a language pin nor request negotiation may change these unilingual documents.
    const index = yield* markdown.siteIndex(new Request(`${LLMS_TXT_INDEX.url}?lang=pl`));
    const full = yield* markdown.siteIndexFull(new Request(`${LLMS_FULL_TXT_INDEX.url}?lang=pl`));
    const documents = [
      [index, LLMS_TXT_INDEX.url, buildLlmsTxt([sampleExperience])],
      [full, LLMS_FULL_TXT_INDEX.url, buildLlmsFullTxt({ pageTitles: stablePageTitles, experienceList: [sampleExperience], educationList: [] })],
    ] as const;

    for (const [response, contentLocation, expectedBody] of documents) {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
      assert.strictEqual(response.headers.get("Content-Language"), "en");
      assert.strictEqual(response.headers.get("Content-Location"), contentLocation);
      assert.strictEqual(response.headers.get("Cache-Control"), CACHEABLE_HEADERS["Cache-Control"]);
      assert.strictEqual(response.headers.get("X-Robots-Tag"), NOINDEX_FOLLOW);
      assert.isNull(response.headers.get("Vary"));
      assert.strictEqual(yield* Effect.promise(() => response.text()), expectedBody);
    }
  }).pipe(Effect.provide(testLayer(availableDatasets)))
);

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

it.effect("Markdown documents recover required-data failures as fresh non-cacheable 503 responses", () =>
  Effect.gen(function* () {
    const markdown = yield* Markdown;
    const firstIndex = yield* markdown.siteIndex(new Request(LLMS_TXT_INDEX.url));
    const secondIndex = yield* markdown.siteIndex(new Request(LLMS_TXT_INDEX.url));
    assert.notStrictEqual(firstIndex, secondIndex);

    const responses = [
      [yield* markdown.page(HOME_PATH)(new Request("https://www.remiforge.dev/index.md?lang=en")), "https://www.remiforge.dev/index.md?lang=en"],
      [yield* markdown.experience(new Request("https://www.remiforge.dev/sample-role.md?lang=en")), "https://www.remiforge.dev/sample-role.md?lang=en"],
      [firstIndex, LLMS_TXT_INDEX.url],
      [secondIndex, LLMS_TXT_INDEX.url],
      [yield* markdown.siteIndexFull(new Request(LLMS_FULL_TXT_INDEX.url)), LLMS_FULL_TXT_INDEX.url],
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

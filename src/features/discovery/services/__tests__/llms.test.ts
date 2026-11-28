import { assert, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { RequiredDataError } from "@/features/data/domain/required";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/domain/discovery";
import { CACHEABLE_HEADERS } from "@/lib/http-response";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/features/discovery/domain/llms";
import { NOINDEX_FOLLOW } from "@/domain/http";
import { sampleEmployment } from "@/testing/fixtures";
import { Discovery } from "../llms";

const failed = (dataset: string) => Effect.fail(new RequiredDataError({ dataset, message: `test outage: ${dataset}` }));

const unavailableDatasets = {
  experienceList: () => failed("experience list"),
  educationList: () => failed("education list"),
};

const availableDatasets = {
  experienceList: () => Effect.succeed([sampleEmployment]),
  educationList: () => Effect.succeed([]),
};

const testLayer = (datasets: Datasets["Service"]) => Discovery.layer.pipe(Layer.provide(Layer.succeed(Datasets, datasets)));

it.effect("Discovery AI indexes serve English source content with cacheable discovery envelopes", () =>
  Effect.gen(function* () {
    const discovery = yield* Discovery;
    // Neither a language pin nor request negotiation may change these unilingual documents.
    const index = yield* discovery.siteIndex(new Request(`${LLMS_TXT_INDEX.url}?lang=pl`));
    const full = yield* discovery.siteIndexFull(new Request(`${LLMS_FULL_TXT_INDEX.url}?lang=pl`));
    const documents = [
      [index, LLMS_TXT_INDEX.url, buildLlmsTxt([sampleEmployment])],
      [full, LLMS_FULL_TXT_INDEX.url, buildLlmsFullTxt({ experienceList: [sampleEmployment], educationList: [] })],
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

it.effect("Discovery indexes recover required-data failures as fresh non-cacheable 503 responses", () =>
  Effect.gen(function* () {
    const discovery = yield* Discovery;
    const firstIndex = yield* discovery.siteIndex(new Request(LLMS_TXT_INDEX.url));
    const secondIndex = yield* discovery.siteIndex(new Request(LLMS_TXT_INDEX.url));
    assert.notStrictEqual(firstIndex, secondIndex);

    const responses = [
      [firstIndex, LLMS_TXT_INDEX.url],
      [secondIndex, LLMS_TXT_INDEX.url],
      [yield* discovery.siteIndexFull(new Request(LLMS_FULL_TXT_INDEX.url)), LLMS_FULL_TXT_INDEX.url],
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

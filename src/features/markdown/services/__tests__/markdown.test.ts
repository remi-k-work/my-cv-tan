import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { RequiredDataError } from "@/features/data/domain/required";
import { HOME_PATH } from "@/domain/constants";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/discovery";
import { Markdown } from "../markdown";

const failed = (dataset: string) => Effect.fail(new RequiredDataError({ dataset, message: `test outage: ${dataset}` }));

const unavailableDatasets = {
  pageTitles: () => failed("page titles"),
  experienceList: () => failed("experience list"),
  educationList: () => failed("education list"),
};

it.effect("Markdown documents recover required-data failures as fresh non-cacheable 503 responses", () =>
  Effect.gen(function* () {
    const markdown = yield* Markdown.make.pipe(Effect.provideService(Datasets, unavailableDatasets));
    const firstIndex = yield* markdown.siteIndex(new Request(LLMS_TXT_INDEX.url));
    const secondIndex = yield* markdown.siteIndex(new Request(LLMS_TXT_INDEX.url));
    assert.notStrictEqual(firstIndex, secondIndex);

    const responses = [
      yield* markdown.page(HOME_PATH)(new Request("https://www.remiforge.dev/index.md?lang=en")),
      yield* markdown.experience(new Request("https://www.remiforge.dev/sample-role.md?lang=en")),
      firstIndex,
      secondIndex,
      yield* markdown.siteIndexFull(new Request(LLMS_FULL_TXT_INDEX.url)),
    ];

    for (const response of responses) {
      assert.strictEqual(response.status, 503);
      assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
      assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
      assert.strictEqual(response.headers.get("Retry-After"), "300");
      assert.include(yield* Effect.promise(() => response.text()), "temporarily unavailable");
    }
  })
);

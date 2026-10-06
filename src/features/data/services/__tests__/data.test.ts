// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { Data } from "../data";

// assets
import pageTitlesEn from "@/assets/data/en/page-titles.json";
import pageTitlesPl from "@/assets/data/pl/page-titles.json";

it.effect("stablePageTitles always selects the first authored entry for each locale", () =>
  Effect.gen(function* () {
    const data = yield* Data;
    const english = yield* data.stablePageTitles(Option.some("en"), Option.none());
    const polish = yield* data.stablePageTitles(Option.some("pl"), Option.none());

    assert.deepStrictEqual(english, Option.some(pageTitlesEn[0]));
    assert.deepStrictEqual(polish, Option.some(pageTitlesPl[0]));
  }).pipe(Effect.provide(Data.layer))
);

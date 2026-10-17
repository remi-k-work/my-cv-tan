// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { Data } from "../data";
import { RequiredDataError } from "@/features/data/domain/required";
import { applyHtmlDataUnavailableResponse, markHtmlDataUnavailable } from "@/features/data/http/html-response";

// assets
import pageTitlesEn from "@/assets/data/en/page-titles.json";
import pageTitlesPl from "@/assets/data/pl/page-titles.json";

it.effect("stablePageTitles always selects the first authored entry for each locale", () =>
  Effect.gen(function* () {
    const data = yield* Data;
    const english = yield* data.stablePageTitles(Option.some("en"));
    const polish = yield* data.stablePageTitles(Option.some("pl"));

    assert.deepStrictEqual(english, Option.some(pageTitlesEn[0]));
    assert.deepStrictEqual(polish, Option.some(pageTitlesPl[0]));
  }).pipe(Effect.provide(Data.layer))
);

it.effect("randomPageTitles selects from the requested locale", () =>
  Effect.gen(function* () {
    const data = yield* Data;
    const english = yield* data.randomPageTitles(Option.some("en"));
    const polish = yield* data.randomPageTitles(Option.some("pl"));

    assert.isTrue(
      Option.match(english, {
        onNone: () => false,
        onSome: (entry) => pageTitlesEn.some((page) => page["/"].eyebrow === entry["/"].eyebrow),
      })
    );
    assert.isTrue(
      Option.match(polish, {
        onNone: () => false,
        onSome: (entry) => pageTitlesPl.some((page) => page["/"].eyebrow === entry["/"].eyebrow),
      })
    );
  }).pipe(Effect.provide(Data.layer))
);

it("required HTML data failures preserve the rendered error page and return a non-cacheable 503", async () => {
  const request = new Request("https://www.remiforge.dev/education");
  const errorResponse = new Response("<!doctype html><title>Error</title>", {
    status: 500,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  markHtmlDataUnavailable(request, new RequiredDataError({ dataset: "education list", message: "missing" }));
  const response = applyHtmlDataUnavailableResponse(request, errorResponse);

  assert.strictEqual(response.status, 503);
  assert.strictEqual(response.headers.get("Content-Type"), "text/html; charset=utf-8");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(await response.text(), "<!doctype html><title>Error</title>");
});

it("ordinary HTML 404 responses keep their status and headers", () => {
  const request = new Request("https://www.remiforge.dev/missing");
  const notFound = new Response("Not found", { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });

  markHtmlDataUnavailable(request, new Error("missing slug"));
  assert.strictEqual(applyHtmlDataUnavailableResponse(request, notFound), notFound);
});

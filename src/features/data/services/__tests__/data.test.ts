// services, features, and other libraries
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { Data, localizedExperienceAsset } from "../data";
import { RequiredDataError } from "@/features/data/domain/required";
import { applyHtmlDataUnavailableResponse, markHtmlDataUnavailable } from "@/features/data/http/html-response";
import { haveSameExperienceSlugs } from "@/features/experience/domain/helpers";

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

it.effect("localized experience assets keep the same unique canonical route identities", () =>
  Effect.gen(function* () {
    const data = yield* Data;
    const english = yield* data.experienceList(Option.some("en"));
    const polish = yield* data.experienceList(Option.some("pl"));

    assert.isTrue(Option.isSome(english) && Option.isSome(polish) && haveSameExperienceSlugs(english.value, polish.value));
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

describe("localizedExperienceAsset", () => {
  // Two bundles that name the same unique routes in a different display order
  const english = Option.some([{ slug: "alpha" }, { slug: "beta" }]);
  const polish = Option.some([{ slug: "beta" }, { slug: "alpha" }]);
  const unpublished: Record<"en" | "pl", Option.Option<ReadonlyArray<{ readonly slug: string }>>> = { en: Option.none(), pl: Option.none() };

  it("publishes both locales when each bundle decodes to the same unique canonical routes", () => {
    assert.deepStrictEqual(localizedExperienceAsset(english, polish), { en: english, pl: polish });
  });

  it("drops both locales when the two bundles decode to different canonical routes", () => {
    // One language would 404 on a route the other publishes, and the canonical URLs, the sitemap
    // and the twins would each list a different route set, so neither locale is served
    assert.deepStrictEqual(localizedExperienceAsset(english, Option.some([{ slug: "alpha" }])), unpublished);
  });

  it("drops both locales when either bundle names the same canonical route twice", () => {
    // A repeated slug is an ambiguous route: the shared path resolves to two different entries
    assert.deepStrictEqual(localizedExperienceAsset(english, Option.some([{ slug: "alpha" }, { slug: "alpha" }])), unpublished);
  });

  it("keeps the locale that decoded when the other bundle is missing", () => {
    // The reader of the missing locale never addresses the published one's routes, so partial data
    // still serves the locale that has it rather than failing every language
    assert.deepStrictEqual(localizedExperienceAsset(english, Option.none()), { en: english, pl: Option.none() });
    assert.deepStrictEqual(localizedExperienceAsset(Option.none(), polish), { en: Option.none(), pl: polish });
  });
});

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
  // The downgraded page is a temporary data-layer outage, so it tells the crawler when to retry
  assert.strictEqual(response.headers.get("Retry-After"), "300");
  assert.strictEqual(await response.text(), "<!doctype html><title>Error</title>");
});

it("ordinary HTML 404 responses keep their status and headers", () => {
  const request = new Request("https://www.remiforge.dev/missing");
  const notFound = new Response("Not found", { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });

  markHtmlDataUnavailable(request, new Error("missing slug"));
  const returned = applyHtmlDataUnavailableResponse(request, notFound);
  assert.strictEqual(returned, notFound);
  // A 404 is not a retryable outage, so no retry timing is attached
  assert.isNull(returned.headers.get("Retry-After"));
});

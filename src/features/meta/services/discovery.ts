// --- The two crawl-directive documents ---
//
// robots.txt is fully static: the document constant lives in the domain and only the Response is
// minted here. sitemap.xml is the dynamic sibling — it reads the Datasets service, unions slugs
// across every supported language, and deduplicates so a missing translation never drops a page.
//
// Minted per request rather than held as a constant: a `Response` body is single-use.

// services, features, and other libraries
import { Array, Effect } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { recoverDataFailure } from "@/features/data/domain/required";
import { Datasets } from "@/features/meta/services/datasets";
import { buildSitemapXml } from "@/features/meta/domain/sitemap";
import { ROBOTS_TXT } from "@/features/meta/domain/robots";
import { sitemapResponse, sitemapUnavailableResponse, txtResponse } from "@/features/meta/domain/response";

// constants
import { SITE_LANGUAGES } from "@/features/meta/domain/constants";

// robots.txt is fully static, so the document constant lives in the domain and only the Response is
// minted here. `Effect.sync` (not `Effect.succeed`) is intentional: `txtResponse(ROBOTS_TXT)` must
// run fresh on every effect execution so each crawler gets a single-use Response body — the test
// asserts two calls return distinct Response objects.
export const robotsDocument = Effect.sync(() => txtResponse(ROBOTS_TXT));

// HTML documents are language-negotiated, never duplicated per locale, so the sitemap lists one URL
// per experience. Every localized list is read and unioned by slug, which both covers the whole
// portfolio and keeps a missing translation from silently dropping a page.
//
// lastmod is intentionally omitted: the source data carries a year only, so a fabricated ISO date
// would be a false freshness signal.
//
// The crawlable-slug lookup is inlined here (it had no other caller) and the layer is attached with
// .pipe combinators rather than wrapping Effect.provide around a pre-built effect — per the Effect
// AGENTS.md guidance to attach behaviour with combinators instead of nesting.
//
// `Effect.gen` (inline Effect code) replaces the previous `Effect.fn(...)()` double-invocation,
// which returned a function that had to be called with no args. `Effect.withSpan` keeps the named
// trace boundary without the confusing call pattern.
export const sitemapDocument = Effect.gen(function* () {
  const { experienceList } = yield* Datasets;

  // Fan out over SITE_LANGUAGES rather than destructuring the first two: adding a locale is picked
  // up by the sitemap instead of silently dropping it.
  const lists = yield* Effect.all(Array.map(SITE_LANGUAGES, experienceList));

  // Dedupe preserves first-seen order, so crawl order stays the source-language order even when the
  // translated list only adds entries.
  const slugs = Array.dedupe(
    Array.flatMap(lists, (list) => Array.map(list, ({ slug }) => ({ slug } as const)))
  );

  return sitemapResponse(buildSitemapXml(slugs));
}).pipe(
  // The Datasets dependency is internal to this layer: route handlers only need the shared runtime.
  Effect.provide(Datasets.layer),
  // A transient data failure becomes a non-cacheable noindex 503, never a 500.
  recoverDataFailure("[SITEMAP.XML]", sitemapUnavailableResponse),
  Effect.withSpan("sitemapDocument")
);

// Bridges one machine-readable document to the TanStack server handler signature.
export const handler = (document: Effect.Effect<Response, never>) => () =>
  RuntimeServer.runPromise(document);

export const robotsHandler = handler(robotsDocument);
export const sitemapHandler = handler(sitemapDocument);

import { assert, it } from "@effect/vitest";
import { headLanguage, routeHead } from "../route-head";
import { rootHead } from "../root-head";
import { homeHead } from "../page-head";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import type { PageTitles } from "@/domain/models";
import type { PageHead } from "../models";

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

// The loader payload shapes headLanguage sees: a valid locale, an unsupported
// one, and a missing match entry (404 / SSR shell renders before the root loader resolves)
const rootLoaderData = [{ loaderData: { preferredLanguage: "pl" } }, { loaderData: { preferredLanguage: "de" } }] as const;

it("routeHead keeps a canonical noindex fallback when loader data is missing", () => {
  const fallback = routeHead({
    loaderData: undefined,
    matches: [],
    matchStatus: "success",
    fallbackPath: "/contact",
    build: () => homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }),
  });

  assert.deepStrictEqual(
    fallback.links?.map(({ rel, href }) => ({ rel, href })),
    [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]
  );
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Page unavailable"');
  assert.include(JSON.stringify(fallback.meta), "This page is temporarily unavailable.");
  // The fallback still publishes the site entities, just not the page's own graph.
  assert.isAbove(JSON.parse(fallback.scripts?.[0]?.children ?? "{}")["@graph"].length, 0);
});

it("routeHead leaves not-found metadata to the root boundary, even with stale loader data", () => {
  let builderCalled = false;
  const build = () => {
    builderCalled = true;
    return homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" });
  };

  const notFound = routeHead({
    loaderData: { title: "Stale page data" },
    matches: [{ loaderData: { preferredLanguage: "pl" }, status: "error", _notFound: true }],
    matchStatus: "error",
    fallbackPath: "/missing",
    build,
  });
  const rootFallback = rootHead([{ loaderData: { preferredLanguage: "pl" }, status: "success" }, { status: "notFound" }]);

  assert.deepStrictEqual(notFound, { meta: [], links: [], scripts: [] });
  assert.isFalse(builderCalled);
  assert.include(JSON.stringify(rootFallback.meta), '"title":"Remi Forge ● Nie znaleziono"');
  assert.include(JSON.stringify(rootFallback.meta), "Nie znaleziono żądanej strony.");
  assert.include(JSON.stringify(rootFallback.meta), NOINDEX_FOLLOW);
});

it("routeHead uses a noindex unavailable head instead of stale loader data after an error", () => {
  let builderCalled = false;
  const fallback = routeHead({
    loaderData: { title: "Stale page data" },
    matches: [{ loaderData: { preferredLanguage: "pl" }, status: "error" }],
    matchStatus: "error",
    fallbackPath: "/missing",
    build: () => {
      builderCalled = true;
      return pageHeadFromInput("Stale page data", "pl");
    },
  });

  assert.isFalse(builderCalled);
  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Strona niedostępna"');
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.deepStrictEqual(fallback.links, [{ rel: "canonical", href: "https://www.remiforge.dev/missing" }]);
});

it("routeHead ignores stale loader data while the current match is pending", () => {
  let builderCalled = false;
  const fallback = routeHead({
    loaderData: { title: "Previous route data" },
    matches: [
      { loaderData: { preferredLanguage: "pl" }, status: "success" },
      { loaderData: { title: "Previous route data" }, status: "pending" },
    ],
    matchStatus: "pending",
    fallbackPath: "/contact",
    build: () => {
      builderCalled = true;
      return pageHeadFromInput("Previous route data", "pl");
    },
  });

  assert.isFalse(builderCalled);
  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Strona niedostępna"');
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.deepStrictEqual(fallback.links, [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]);
  assert.strictEqual(fallback.scripts?.length, 1);
});

it("routeHead delegates to the builder when loader data is present, resolving language from matches", () => {
  const build = (loaderData: { readonly title: string }, preferredLanguage: "en" | "pl") => pageHeadFromInput(loaderData.title, preferredLanguage);
  const matches = [{ loaderData: { preferredLanguage: "pl" } }];

  const head = routeHead({ loaderData: { title: "Custom" }, matches, matchStatus: "success", fallbackPath: "/contact", build });

  // The builder received the loader data and the resolved language
  assert.include(JSON.stringify(head.meta), '"title":"Remi Forge ● Custom"');
  assert.include(JSON.stringify(head.meta), '"content":"pl_PL"');
});

// Minimal inline pageHead substitute for the routeHead delegation test — keeps the test
// self-contained without importing the full page-head module.
const pageHeadFromInput = (title: string, preferredLanguage: "en" | "pl"): PageHead => ({
  meta: [
    { title: `Remi Forge ● ${title}` },
    { name: "robots", content: INDEXABLE_ROBOTS },
    { property: "og:locale", content: preferredLanguage === "pl" ? "pl_PL" : "en_US" },
  ],
  links: [{ rel: "canonical", href: "https://www.remiforge.dev/" }],
  scripts: [],
});

it("headLanguage resolves the root loader locale and falls back safely", () => {
  assert.strictEqual(headLanguage(rootLoaderData), "pl");
  // An unsupported locale and a missing match entry (404 / SSR shell renders before the root loader
  // resolves) are two different causes with one answer: the site default
  assert.strictEqual(headLanguage([{ loaderData: { preferredLanguage: "de" } }]), "en");
  assert.strictEqual(headLanguage([]), "en");
  // A malformed payload degrades to the default language instead of throwing inside head()
  assert.strictEqual(headLanguage([{ loaderData: null }]), "en");
});

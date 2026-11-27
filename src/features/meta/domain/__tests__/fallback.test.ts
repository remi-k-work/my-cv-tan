// Tests for the degraded heads served when a route's data is unavailable or missing.

import { assert, it } from "@effect/vitest";
import { notFoundHead, unavailableHead } from "../fallback";
import { NOINDEX_FOLLOW } from "@/domain/http";
import { graphOf, nodeOf } from "./fixtures";

it("unavailableHead publishes a canonical noindex head with site entities", () => {
  const fallback = unavailableHead("/contact");

  assert.deepStrictEqual(
    fallback.links?.map(({ rel, href }) => ({ rel, href })),
    [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]
  );
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Page unavailable"');
  assert.include(JSON.stringify(fallback.meta), "This page is temporarily unavailable.");
  // The fallback publishes site entities (WebSite, Person, Organization) without a page graph
  const graph = graphOf(fallback.scripts?.[0]?.children);
  assert.isDefined(nodeOf(graph, "WebSite"));
  assert.isDefined(nodeOf(graph, "Person"));
  assert.isDefined(nodeOf(graph, "Organization"));
  // Exactly one JSON-LD block
  assert.strictEqual(fallback.scripts?.length, 1);
});

it("the degraded heads publish copy and canonicals that follow one fact: only the unavailable head names a route", () => {
  // The unavailable and not-found fallbacks differ only in their localized copy, and the copy
  // selection is derived from the same fact that decides the canonical — so a head that publishes
  // an "unavailable" title must name the route it stands in for, and one that names none must
  // carry the not-found copy and no canonical at all.
  const unavailable = unavailableHead("/contact", "pl");
  assert.include(JSON.stringify(unavailable.meta), '"title":"Remi Forge ● Strona niedostępna"');
  assert.deepStrictEqual(unavailable.links, [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]);

  const notFound = notFoundHead("pl");
  assert.include(JSON.stringify(notFound.meta), '"title":"Remi Forge ● Nie znaleziono"');
  assert.include(JSON.stringify(notFound.meta), "Nie znaleziono żądanej strony.");
  assert.strictEqual(notFound.links.length, 0);
  // The site entities are published either way: a fallback is still a document about the site
  assert.isDefined(nodeOf(graphOf(notFound.scripts?.[0]?.children), "Person"));
});
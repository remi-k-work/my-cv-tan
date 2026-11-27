// Direct unit tests for the site-wide JSON-LD entities published on every page.

import { assert, it } from "@effect/vitest";
import { jsonLdGraph } from "../serialize";
import { SITE_NODES } from "../site-nodes";
import { PERSON_DESCRIPTION, SITE_DESCRIPTION } from "@/domain/site";
import { graphOf, nodeOf } from "./fixtures";

it("site graph declares the bilingual audience on WebSite and Person", () => {
  const siteGraph = graphOf(jsonLdGraph(SITE_NODES).children);
  assert.deepStrictEqual(nodeOf(siteGraph, "WebSite")?.inLanguage, ["en", "pl"]);
  assert.deepStrictEqual(nodeOf(siteGraph, "Person")?.knowsLanguage, ["en", "pl"]);
  // Do not publish an alias unless it differs from the primary name.
  assert.isUndefined(nodeOf(siteGraph, "Person")?.alternateName);
  // Every site entity carries an extractable description, single-sourced with the meta tags
  assert.strictEqual(nodeOf(siteGraph, "WebSite")?.description, SITE_DESCRIPTION);
  assert.strictEqual(nodeOf(siteGraph, "Person")?.description, PERSON_DESCRIPTION);
  // The logo and person image are the square avatar with real dimensions, not the wide OG banner
  assert.deepStrictEqual(nodeOf(siteGraph, "Organization")?.logo, {
    "@type": "ImageObject",
    url: "https://www.remiforge.dev/avatar.jpg",
    width: 288,
    height: 288,
  });
  assert.deepStrictEqual(nodeOf(siteGraph, "Person")?.image, {
    "@type": "ImageObject",
    url: "https://www.remiforge.dev/avatar.jpg",
    width: 288,
    height: 288,
  });
});

it("site graph URLs match the homepage canonical byte for byte and close the Person/Organization triangle", () => {
  const siteGraph = graphOf(jsonLdGraph(SITE_NODES).children);
  assert.strictEqual(nodeOf(siteGraph, "WebSite")?.url, "https://www.remiforge.dev/");
  assert.strictEqual(nodeOf(siteGraph, "Person")?.url, "https://www.remiforge.dev/");
  assert.strictEqual(nodeOf(siteGraph, "Organization")?.url, "https://www.remiforge.dev/");
  // Reciprocal of the page-graph publisher edges: the organization claims its person by @id
  assert.deepStrictEqual(nodeOf(siteGraph, "Organization")?.member, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(nodeOf(siteGraph, "WebSite")?.author, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(nodeOf(siteGraph, "WebSite")?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(nodeOf(siteGraph, "Person")?.homeLocation, {
    "@type": "Place",
    name: "Rzeszów, Poland",
    address: { "@type": "PostalAddress", addressLocality: "Rzeszów", addressCountry: "PL" },
  });
  // @ids stay host-rooted fragments, so the site entities merge one-to-one with the page graphs
  assert.strictEqual(nodeOf(siteGraph, "WebSite")?.["@id"], "https://www.remiforge.dev/#website");
});
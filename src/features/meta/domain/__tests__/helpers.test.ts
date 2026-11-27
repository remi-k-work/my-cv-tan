// Temporary holding file for cross-cutting meta tests. The HTTP header policy moves in Phase 4 and
// the JSON-LD serializer tests move to the `jsonld` feature in Phase 3; until then they stay here so
// the suite keeps covering them. Do not add new tests to this file.

import { assert, it } from "@effect/vitest";
import { Option, pipe } from "effect";
import { experienceHead } from "../page-head";
import { documentHeaders } from "@/features/meta/services/responses";
import { jsonLdGraph } from "../jsonld";
import { PERSON_DESCRIPTION, SITE_DESCRIPTION } from "@/domain/site";
import { SITE_NODES } from "../site-nodes";
import { CONTENT_SIGNAL } from "@/domain/discovery";
import { graphOf, nodeOf, sampleExperience, textOf } from "./fixtures";

it("robots.txt responses are English, noindex, and carry the shared reuse signal", () => {
  const polish = documentHeaders("pl");
  const english = documentHeaders("en");

  // Varies by Cookie and Accept-Language for proper CDN cache partitioning.
  assert.strictEqual(polish.Vary, "Cookie, Accept-Language");
  assert.strictEqual(polish["Content-Signal"], CONTENT_SIGNAL);
  assert.strictEqual(polish["Content-Language"], "pl");
  assert.strictEqual(english["Content-Language"], "en");
  assert.strictEqual(polish["X-Content-Type-Options"], "nosniff");
  assert.include(polish.Link, "https://www.remiforge.dev/llms.txt");
  assert.include(polish.Link, "https://www.remiforge.dev/llms-full.txt");
  assert.strictEqual(Object.keys(polish).length, 5);
  assert.deepStrictEqual(
    Object.keys(polish).filter((key) => key !== "Content-Language"),
    Object.keys(english).filter((key) => key !== "Content-Language")
  );
});

it("escapes JSON-LD text before embedding it in a script element", () => {
  const unsafeText = "</script><script>alert(1)</script>";
  const script = jsonLdGraph([{ "@type": "Thing", name: unsafeText }]);

  assert.notInclude(script.children, "<");
  assert.strictEqual(nodeOf(graphOf(script.children), "Thing")?.name, unsafeText);
});

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

it("JSON-LD children escape < so content can never break out of the script tag", () => {
  const hostile = experienceHead({
    experience: { ...sampleExperience, txt: "evil </script><script>alert(1)</script>" },
    preferredLanguage: "en",
  });
  const [graph] = hostile.scripts ?? [];
  assert.notInclude(graph?.children, "</script>");
  assert.include(graph?.children, "\\u003C");
  // The escape is transparent: parsers still see the original text
  const description = pipe(
    Option.fromNullishOr(nodeOf(graphOf(graph?.children), "WebPage")),
    Option.flatMap((node) => textOf(node.description)),
    Option.getOrThrow
  );
  assert.include(description, "</script>");
});
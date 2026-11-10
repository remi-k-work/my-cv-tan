// Direct unit tests for the experience SEO identity builder.
// The HTML head, JSON-LD graph and Markdown twin all derive from this one record,
// so its fields must be correct and consistent on their own.

import { assert, it } from "@effect/vitest";
import { Option, Schema, pipe } from "effect";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";
import { experienceScreenshot, experienceSeo, documentHeaders, fallbackHead, jsonLdGraph } from "../helpers";
import { experienceHead } from "../page-head";
import { META_DESCRIPTION_LENGTH, CONTENT_SIGNAL, SITE_NODES, PERSON_DESCRIPTION, SITE_DESCRIPTION } from "../constants";
import { NOINDEX_FOLLOW } from "@/domain/http";
import type { Experience } from "@/features/experience/domain/models";

// Minimal JSON-LD graph reader for structured-data assertions.
const JsonLdNode = Schema.Record(Schema.String, Schema.Unknown);
const decodeGraph = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Struct({ "@graph": Schema.Array(JsonLdNode) })));

const graphOf = (children: string | undefined): ReadonlyArray<Record<string, unknown>> =>
  pipe(
    decodeGraph(children ?? "{}"),
    Option.map((document) => document["@graph"]),
    Option.getOrElse<ReadonlyArray<Record<string, unknown>>>(() => [])
  );

const nodeOf = (graph: ReadonlyArray<Record<string, unknown>>, type: string, idFragment?: string) =>
  graph.find((node) => node["@type"] === type && (idFragment === undefined || String(node["@id"]).endsWith(idFragment)));

const decodeString = Schema.decodeUnknownOption(Schema.String);

const sampleExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

it("derives canonical, path, markdownPath, headline and description from one experience", () => {
  const seo = experienceSeo({ experience: sampleExperience, preferredLanguage: "en" });

  assert.strictEqual(seo.path, "/sample-role");
  assert.strictEqual(seo.canonical, "https://www.remiforge.dev/sample-role");
  assert.strictEqual(seo.markdownPath, "/sample-role.md");
  assert.strictEqual(seo.headline, "Full-Stack Developer");
  assert.strictEqual(seo.description, "Built things with care.");
  assert.strictEqual(seo.preferredLanguage, "en");
  assert.deepStrictEqual(seo.experience, sampleExperience);
});

it("localizes headline and description for Polish", () => {
  const en = experienceSeo({ experience: sampleExperience, preferredLanguage: "en" });
  const pl = experienceSeo({ experience: sampleExperience, preferredLanguage: "pl" });

  // Same canonical/path regardless of language
  assert.strictEqual(en.canonical, pl.canonical);
  assert.strictEqual(en.path, pl.path);
  assert.strictEqual(en.markdownPath, pl.markdownPath);
  // Localized headline differs
  assert.notStrictEqual(en.headline, pl.headline);
  // Description is excerpted to the meta length cap
  assert.strictEqual(pl.description.length <= META_DESCRIPTION_LENGTH, true);
});

it("resolves screenshot facts when an image is published", () => {
  const withShot = experienceSeo({ experience: sampleExperience, preferredLanguage: "en" });
  assert.deepStrictEqual(Option.getOrThrow(withShot.screenshot), {
    src: "https://www.remiforge.dev/images/01-a.webp",
    mime: "image/webp",
    width: 1600,
    height: 900,
  });

  const withoutShot = experienceSeo({
    experience: { ...sampleExperience, imageName: "" },
    preferredLanguage: "en",
  });
  assert.deepStrictEqual(withoutShot.screenshot, Option.none());
});

it("experienceScreenshot resolves verified WebP facts and ignores an unpublished image", () => {
  const published = {
    src: "https://www.remiforge.dev/images/01-a.webp",
    mime: "image/webp",
    width: SCREENSHOT_WIDTH,
    height: SCREENSHOT_HEIGHT,
  } as const;

  assert.deepStrictEqual(experienceScreenshot("01"), Option.some(published));
  // The name is trimmed, so stray formatting whitespace still resolves the file the UI renders
  assert.deepStrictEqual(experienceScreenshot(" 01 "), Option.some(published));
  // An empty or whitespace-only name means the page publishes no screenshot
  assert.deepStrictEqual(experienceScreenshot(""), Option.none());
  assert.deepStrictEqual(experienceScreenshot("   "), Option.none());
  // The name is one path segment, so a hostile value cannot escape /images/
  assert.strictEqual(Option.getOrThrow(experienceScreenshot("../secret")).src, "https://www.remiforge.dev/images/..%2Fsecret-a.webp");
});

it("encodes slugs consistently in path, canonical and markdownPath", () => {
  const seo = experienceSeo({ experience: { ...sampleExperience, slug: "role (senior) & more" }, preferredLanguage: "en" });
  const encoded = "/role%20%28senior%29%20%26%20more";

  assert.strictEqual(seo.path, encoded);
  assert.strictEqual(seo.canonical, `https://www.remiforge.dev${encoded}`);
  assert.strictEqual(seo.markdownPath, `${encoded}.md`);
});

it("fallbackHead publishes a canonical noindex head with site entities", () => {
  const fallback = fallbackHead("/contact");

  assert.deepStrictEqual(
    fallback.links?.map(({ rel, href }) => ({ rel, href })),
    [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]
  );
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Page unavailable"');
  assert.include(JSON.stringify(fallback.meta), "This page is temporarily unavailable.");
  // The fallback publishes site entities (WebSite, Person, Organization) without a page graph
  const graph = JSON.parse(fallback.scripts?.[0]?.children ?? "{}");
  assert.isDefined(graph["@graph"].find((node: { "@type"?: string }) => node["@type"] === "WebSite"));
  assert.isDefined(graph["@graph"].find((node: { "@type"?: string }) => node["@type"] === "Person"));
  assert.isDefined(graph["@graph"].find((node: { "@type"?: string }) => node["@type"] === "Organization"));
  // Exactly one JSON-LD block
  assert.strictEqual(fallback.scripts?.length, 1);
});

it("fallbackHead's copy and canonical follow one fact: no route to name is the not-found head", () => {
  // The unavailable and not-found fallbacks differ only in their localized copy, and the copy
  // selection is derived from the same fact that decides the canonical — so a head that publishes
  // an "unavailable" title must name the route it stands in for, and one that names none must
  // carry the not-found copy and no canonical at all.
  const unavailable = fallbackHead("/contact", "pl");
  assert.include(JSON.stringify(unavailable.meta), '"title":"Remi Forge ● Strona niedostępna"');
  assert.deepStrictEqual(unavailable.links, [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]);

  const notFound = fallbackHead(undefined, "pl");
  assert.include(JSON.stringify(notFound.meta), '"title":"Remi Forge ● Nie znaleziono"');
  assert.include(JSON.stringify(notFound.meta), "Nie znaleziono żądanej strony.");
  assert.strictEqual(notFound.links.length, 0);
  // The site entities are published either way: a fallback is still a document about the site
  assert.isDefined(JSON.parse(notFound.scripts?.[0]?.children ?? "{}")["@graph"].find((node: { "@type"?: string }) => node["@type"] === "Person"));
});

it("robots.txt responses are English, noindex, and carry the shared reuse signal", () => {
  const polish = documentHeaders("pl");
  const english = documentHeaders("en");

  // Varies by Cookie and Accept-Language for proper CDN cache partitioning.
  assert.strictEqual(polish.Vary, "Cookie, Accept-Language");
  assert.strictEqual(polish["Content-Signal"], CONTENT_SIGNAL);
  assert.strictEqual(polish["Content-Language"], "pl");
  assert.strictEqual(english["Content-Language"], "en");
  assert.include(polish.Link, "https://www.remiforge.dev/llms.txt");
  assert.include(polish.Link, "https://www.remiforge.dev/llms-full.txt");
  assert.strictEqual(Object.keys(polish).length, 4);
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
    decodeGraph(graph?.children ?? "{}"),
    Option.flatMap((document) => decodeString(document["@graph"].find((node) => node["@type"] === "WebPage")?.description)),
    Option.getOrThrow
  );
  assert.include(description, "</script>");
});

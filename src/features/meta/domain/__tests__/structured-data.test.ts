// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option, Schema, pipe } from "effect";
import { contactHead, educationHead, experienceHead, homeHead } from "../page-head";
import { ROOT_HEAD } from "../root-head";
import { jsonLdGraph } from "../merge";
import { siteNodes } from "../entities";

import { PERSON_DESCRIPTION, SITE_DESCRIPTION, PERSON_ID, PROFILE_ID } from "../constants";

// types
import type { PageTitles } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience } from "@/features/experience/domain/models";

// Minimal JSON-LD graph readers for structured-data assertions.
//
// Every page emits `jsonLdScript`, so the payload is already a JSON string by the time it
// reaches here. Rather than asserting its shape with casts, the document is decoded with
// Schema: structured data that fails to parse becomes an empty graph, which makes the
// following assertions fail loudly instead of quietly reading `undefined` off a cast.
//
// A node is an open record (any schema.org property) because the assertions below probe
// arbitrary fields; the two containers are the only shapes the readers index into.
const JsonLdNode = Schema.Record(Schema.String, Schema.Unknown);
type JsonLdNode = typeof JsonLdNode.Type;
const JsonLdReferenceList = Schema.Array(JsonLdNode);
const decodeReferenceList = Schema.decodeUnknownOption(JsonLdReferenceList);
// `fromJsonString` parses the JSON string and validates the document in one step, so malformed
// or non-conforming payloads decode to `None` instead of throwing out of a raw `JSON.parse`
const decodeGraph = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Struct({ "@graph": JsonLdReferenceList })));
// The escaping test reads one known field, so decode its type instead of casting the parsed document
const decodeString = Schema.decodeUnknownOption(Schema.String);

const graphOf = (children: string | undefined): ReadonlyArray<JsonLdNode> =>
  pipe(
    decodeGraph(children ?? "{}"),
    Option.map((document) => document["@graph"]),
    Option.getOrElse<ReadonlyArray<JsonLdNode>>(() => [])
  );

const nodeOf = (graph: ReadonlyArray<JsonLdNode>, type: string, idFragment?: string) =>
  graph.find((node) => node["@type"] === type && (idFragment === undefined || String(node["@id"]).endsWith(idFragment)));

// Two nodes sharing an @id describe one entity (JSON-LD spec §7), which is exactly how the page
// graphs attach a new edge to the site Person. Resolving by @id — merging, with the later
// declaration winning — mirrors a parser's flatten instead of reading whichever entry the
// serializer happened to emit first.
const personOf = (graph: ReadonlyArray<JsonLdNode>) => {
  const nodes = graph.filter((node) => node["@type"] === "Person" && node["@id"] === PERSON_ID);
  return nodes.length === 0 ? undefined : Object.assign({}, ...nodes);
};

// Optional ordered reference list carried by a node; validated on read so a node that lacks
// the key, or carries something that is not a list of nodes, decodes to an empty list
const childNodes = (node: JsonLdNode | undefined, key: string): ReadonlyArray<JsonLdNode> =>
  pipe(
    Option.fromNullishOr(node),
    Option.flatMap((value) => decodeReferenceList(value[key])),
    Option.getOrElse<ReadonlyArray<JsonLdNode>>(() => [])
  );

const listItems = (node: JsonLdNode | undefined) => childNodes(node, "itemListElement");
// Grouped page/school references carried by Collection nodes (the non-carousel replacement for ItemList)
const collectionParts = (node: JsonLdNode | undefined) => childNodes(node, "hasPart");

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

const sampleEducation: EducationList = [{ name: "Pratt Institute", year: "• 2002 — 2004 •", location: "New York, US", info: "Interactive Media." }];

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

// The site entities every page merges into its own single block; the head carries no script of its
// own because TanStack concatenates rather than replaces them (see pageHead in heads.ts)
const siteGraph = graphOf(jsonLdGraph(siteNodes).children);

it("the root head carries no JSON-LD, so a page's single block is not duplicated", () => {
  // TanStack concatenates the scripts of every match in the chain rather than replacing them, so a
  // root-level graph would render beside a page's own. Asserting the root declares none is what
  // keeps the "exactly one block per page" invariant below from silently regressing (the compile
  // guard for it lives on RootHeadContract in heads.ts).
  assert.notInclude(JSON.stringify(ROOT_HEAD), "ld+json");
  // The root still declares the site-wide facts every page shares: icons, identity links, and the
  // AI discovery documents an unmatched route needs to point AI fetchers at the document graph
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/llms.txt");
});

it("site graph declares the bilingual audience on WebSite and Person", () => {
  assert.deepStrictEqual(nodeOf(siteGraph, "WebSite")?.inLanguage, ["en", "pl"]);
  assert.deepStrictEqual(nodeOf(siteGraph, "Person")?.knowsLanguage, ["en", "pl"]);
  // alternateName helps knowledge-graph disambiguation
  assert.strictEqual(nodeOf(siteGraph, "Person")?.alternateName, "Remi Forge");
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
  assert.strictEqual(nodeOf(siteGraph, "WebSite")?.url, "https://www.remiforge.dev/");
  assert.strictEqual(nodeOf(siteGraph, "Person")?.url, "https://www.remiforge.dev/");
  assert.strictEqual(nodeOf(siteGraph, "Organization")?.url, "https://www.remiforge.dev/");
  // Reciprocal of the page-graph publisher edges: the organization claims its person by @id
  assert.deepStrictEqual(nodeOf(siteGraph, "Organization")?.member, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(nodeOf(siteGraph, "WebSite")?.author, { "@id": "https://www.remiforge.dev/#person" });
  // @ids stay host-rooted fragments, so the site entities merge one-to-one with the page graphs
  assert.strictEqual(nodeOf(siteGraph, "WebSite")?.["@id"], "https://www.remiforge.dev/#website");
});

it("every page head emits exactly one JSON-LD block, merging the site entities with the page's own", () => {
  const heads = [
    homeHead({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en" }),
    educationHead({ pageTitles: stablePageTitles, educationList: sampleEducation, preferredLanguage: "en" }),
    contactHead({ pageTitles: stablePageTitles, preferredLanguage: "en" }),
    experienceHead({ experience: sampleExperience, preferredLanguage: "en" }),
  ];

  for (const head of heads) {
    // TanStack concatenates the scripts of every match in the chain, so a root-level graph would
    // render beside a page's own and hand a crawler two blocks to reconcile for one page
    assert.strictEqual(head.scripts?.length, 1);
    const graph = graphOf(head.scripts?.[0]?.children);
    // The site entities are readable in the same parse pass as the page's own nodes
    for (const type of ["WebSite", "Person", "Organization"]) assert.isDefined(nodeOf(graph, type), `missing ${type}`);
    // Exactly one definition each: the merge must not duplicate the entities it imports
    for (const type of ["WebSite", "Person", "Organization"]) {
      assert.strictEqual(graph.filter((node) => node["@type"] === type).length, 1, `duplicated ${type}`);
    }
  }

  // The site entities are module constants, so merging them cannot mutate shared state between renders
  const first = homeHead({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en" });
  const second = homeHead({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en" });
  assert.strictEqual(first.scripts?.[0]?.children, second.scripts?.[0]?.children);
});

it("the @graph merge folds every repeated @id into one node, first declaration first", () => {
  const graph = graphOf(
    jsonLdGraph([
      { "@type": "Person", "@id": "https://www.remiforge.dev/#person", name: "First" },
      { "@type": "WebPage", "@id": "https://www.remiforge.dev/first", name: "A page" },
      { "@type": "Person", "@id": "https://www.remiforge.dev/#person", jobTitle: "Web Developer" },
      { "@type": "Person", "@id": "https://www.remiforge.dev/#person", name: "Last" },
    ]).children
  );

  // One definition carries every property, and the last declaration's field wins
  const people = graph.filter((node) => node["@type"] === "Person");
  assert.strictEqual(people.length, 1);
  assert.strictEqual(people[0]?.name, "Last");
  assert.strictEqual(people[0]?.jobTitle, "Web Developer");

  // The first occurrence keeps its position: a merged entity never jumps in front of the node
  // that preceded it, so the graph still reads page-entity-first
  assert.strictEqual(graph.findIndex((node) => node["@type"] === "Person") < graph.findIndex((node) => node["@type"] === "WebPage"), true);
});

it("the @graph merge treats @id as identity even when a node has no @type", () => {
  const graph = graphOf(
    jsonLdGraph([
      { "@id": "https://www.remiforge.dev/#about", name: "First" },
      { "@id": "https://www.remiforge.dev/#contact", url: "https://www.remiforge.dev/contact" },
      { "@id": "https://www.remiforge.dev/#about", description: "About the site." },
    ]).children
  );

  assert.deepStrictEqual(graph, [
    { "@id": "https://www.remiforge.dev/#about", name: "First", description: "About the site." },
    { "@id": "https://www.remiforge.dev/#contact", url: "https://www.remiforge.dev/contact" },
  ]);
});

it("the @graph merge ignores undefined fields instead of erasing known values", () => {
  const graph = graphOf(
    jsonLdGraph([
      { "@type": "Person", "@id": "https://www.remiforge.dev/#person", name: "Remi Forge" },
      { "@type": "Person", "@id": "https://www.remiforge.dev/#person", name: undefined, jobTitle: "Web Developer" },
    ]).children
  );

  assert.deepStrictEqual(graph, [{ "@type": "Person", "@id": "https://www.remiforge.dev/#person", name: "Remi Forge", jobTitle: "Web Developer" }]);
});

it("the @graph merge publishes a node without an @id exactly as written", () => {
  // A cross-reference or an embedded value object has no stable identity, so it must never be
  // absorbed into — or collide with — an identified neighbour
  const graph = graphOf(
    jsonLdGraph([
      { "@type": "ImageObject", url: "https://www.remiforge.dev/a.jpg", width: 1, height: 1 },
      { "@type": "ImageObject", url: "https://www.remiforge.dev/b.jpg", width: 2, height: 2 },
    ]).children
  );

  assert.strictEqual(graph.length, 2);
  assert.deepStrictEqual(graph[0], { "@type": "ImageObject", url: "https://www.remiforge.dev/a.jpg", width: 1, height: 1 });
});

it("project details use SoftwareSourceCode linked to the canonical WebPage, person and breadcrumb", () => {
  const pl = experienceHead({ experience: sampleExperience, preferredLanguage: "pl" });
  const [graph] = pl.scripts ?? [];
  const parsed = graphOf(graph?.children);
  const page = nodeOf(parsed, "WebPage");
  const project = nodeOf(parsed, "SoftwareSourceCode");
  const article = nodeOf(parsed, "Article");
  assert.isDefined(page);
  assert.isDefined(project);
  assert.isDefined(article);
  // The page's mainEntity is now the Article node: the page describes an article about one subject,
  // and the Article in turn names the project as its subject. This gives AI crawlers an
  // article-shaped entry point they can cite without parsing body prose.
  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/sample-role#article" });
  assert.deepStrictEqual(page?.breadcrumb, { "@id": "https://www.remiforge.dev/sample-role#breadcrumb" });
  assert.deepStrictEqual(nodeOf(parsed, "BreadcrumbList")?.["@id"], "https://www.remiforge.dev/sample-role#breadcrumb");
  assert.deepStrictEqual(project?.mainEntityOfPage, { "@id": "https://www.remiforge.dev/sample-role" });
  assert.deepStrictEqual(article?.about, { "@id": "https://www.remiforge.dev/sample-role#project" });
  // The Article carries the author and publisher edges for authoritative attribution
  assert.deepStrictEqual(article?.author, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(article?.publisher, { "@id": "https://www.remiforge.dev/#publisher" });
  assert.deepStrictEqual(article?.mainEntityOfPage, { "@id": "https://www.remiforge.dev/sample-role" });
  assert.deepStrictEqual(project?.creator, { "@id": "https://www.remiforge.dev/#person" });
  assert.strictEqual(project?.inLanguage, "pl");
  assert.strictEqual(project?.keywords, "TypeScript, React");
  // Schema.org's link to the source repository, single-sourced from the content's GitHub URL
  assert.strictEqual(project?.codeRepository, "https://github.com/example/repo");
  // The image is a sized ImageObject: scrapers learn the dimensions without fetching the file
  assert.deepStrictEqual(project?.image, {
    "@type": "ImageObject",
    url: "https://www.remiforge.dev/images/01-a.webp",
    width: 1600,
    height: 900,
  });
  // The Article carries the same verified picture, so an extractor that reads only Article
  // markup still finds a page image without following the mainEntity reference
  assert.deepStrictEqual(article?.image, project?.image);
  assert.isDefined(nodeOf(parsed, "BreadcrumbList"));
});

it("employment details use OrganizationRole linked to the person and canonical WebPage without fabricated dates", () => {
  const experience = { ...sampleExperience, type: "e" as const, slug: "sample-job" };
  const head = experienceHead({ experience, preferredLanguage: "en" });
  const parsed = graphOf(head.scripts?.[0]?.children);
  const page = nodeOf(parsed, "WebPage");
  const role = nodeOf(parsed, "OrganizationRole");
  const organization = nodeOf(parsed, "Organization", "#organization");
  const article = nodeOf(parsed, "Article");

  assert.isDefined(role);
  assert.isDefined(article);
  // schema.org Role has no inLanguage; the WebPage node carries the page language instead
  assert.isUndefined(role?.inLanguage);
  assert.strictEqual(page?.inLanguage, "en");
  // The page's mainEntity is the Article node; the Article references the role as its subject
  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/sample-job#article" });
  assert.deepStrictEqual(article?.mainEntityOfPage, { "@id": "https://www.remiforge.dev/sample-job" });
  assert.deepStrictEqual(article?.about, { "@id": "https://www.remiforge.dev/sample-job#organization-role" });
  assert.deepStrictEqual(role?.member, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(role?.mainEntityOfPage, { "@id": "https://www.remiforge.dev/sample-job" });
  assert.strictEqual(organization?.name, "Sample Co");
  // The employer claims the person; the OrganizationRole is reached through the Article's subject
  assert.deepStrictEqual(organization?.member, { "@id": "https://www.remiforge.dev/#person" });
  // The reciprocal Person edge: "works for" is readable from the person side of the graph too
  assert.deepStrictEqual(personOf(parsed)?.worksFor, { "@id": "https://www.remiforge.dev/sample-job#organization" });
  assert.notInclude(JSON.stringify(role), "startDate");
  assert.notInclude(JSON.stringify(role), "endDate");
  // Employment pages render screenshots too, so their WebPage claims the same main image
  assert.deepStrictEqual(page?.primaryImageOfPage, {
    "@type": "ImageObject",
    url: "https://www.remiforge.dev/images/01-a.webp",
    width: 1600,
    height: 900,
  });
});

it("experience pages claim the screenshot as their main image only when one exists", () => {
  const withShot = graphOf(experienceHead({ experience: sampleExperience, preferredLanguage: "en" }).scripts?.[0]?.children);
  assert.deepStrictEqual(nodeOf(withShot, "WebPage")?.primaryImageOfPage, {
    "@type": "ImageObject",
    url: "https://www.remiforge.dev/images/01-a.webp",
    width: 1600,
    height: 900,
  });

  // No screenshot on the page: no main-image (or project image) claim, and og:image falls back to the share banner
  const bareHead = experienceHead({ experience: { ...sampleExperience, imageName: "" }, preferredLanguage: "en" });
  const bareGraph = graphOf(bareHead.scripts?.[0]?.children);
  assert.isUndefined(nodeOf(bareGraph, "WebPage")?.primaryImageOfPage);
  assert.isUndefined(nodeOf(bareGraph, "SoftwareSourceCode")?.image);
  assert.isUndefined(nodeOf(bareGraph, "Article")?.image);
  assert.include(JSON.stringify(bareHead.meta), "https://www.remiforge.dev/opengraph-image.jpg");
});

it("home structured data is a first-party ProfilePage linking site entities plus grouped content collections", () => {
  const head = homeHead({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en" });
  const graph = graphOf(head.scripts?.[0]?.children);
  const profile = nodeOf(graph, "ProfilePage");
  assert.strictEqual(profile?.["@id"], PROFILE_ID);
  assert.deepStrictEqual(profile?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(profile?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  // Collection nodes carry stable @ids like every other entity in the graph; the sample is a
  // project, so the employment group is absent and only the portfolio collection renders
  const portfolio = nodeOf(graph, "Collection");
  assert.strictEqual(portfolio?.["@id"], "https://www.remiforge.dev/#portfolio-list");
  assert.strictEqual(portfolio?.inLanguage, "en");
  assert.strictEqual(portfolio?.name, "Portfolio Projects");
  // Each part references the detail page (by @id and URL) with the same translated headline the page shows, in slider order
  assert.deepStrictEqual(collectionParts(portfolio), [
    { "@type": "WebPage", "@id": "https://www.remiforge.dev/sample-role", url: "https://www.remiforge.dev/sample-role", name: "Full-Stack Developer" },
  ]);

  // An empty portfolio still emits the ProfilePage graph, never a misleading empty Collection
  const emptyGraph = graphOf(homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }).scripts?.[0]?.children);
  assert.isTrue(emptyGraph.some((node) => node["@type"] === "ProfilePage"));
  assert.isFalse(emptyGraph.some((node) => node["@type"] === "Collection"));
});

it("no page head emits an ItemList: Google's Carousel beta only supports Course, Movie, Recipe and Restaurant", () => {
  const heads = [
    homeHead({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en" }),
    educationHead({ pageTitles: stablePageTitles, educationList: sampleEducation, preferredLanguage: "en" }),
    contactHead({ pageTitles: stablePageTitles, preferredLanguage: "en" }),
    experienceHead({ experience: sampleExperience, preferredLanguage: "en" }),
  ];
  // Any ItemList on this site could only ever surface as an invalid carousel candidate
  for (const head of heads) assert.notInclude(JSON.stringify(head.scripts), '"@type":"ItemList"');
});

it("home structured data splits employment from portfolio projects with localized collection names", () => {
  const mixed = [sampleExperience, { ...sampleExperience, type: "e" as const, slug: "sample-job" }];
  const graph = graphOf(homeHead({ pageTitles: stablePageTitles, experienceList: mixed, preferredLanguage: "pl" }).scripts?.[0]?.children);
  // Two labeled collections mirror the HTML page and .md twin grouping, in visible order
  const collections = graph.filter((node) => node["@type"] === "Collection");
  assert.deepStrictEqual(
    collections.map((node) => node.name),
    ["Doświadczenie", "Projekty do Portfolio"]
  );
  assert.deepStrictEqual(
    collections.map((node) => node["@id"]),
    ["https://www.remiforge.dev/#experience-list", "https://www.remiforge.dev/#portfolio-list"]
  );
  assert.strictEqual(collectionParts(collections[0])?.[0]?.url, "https://www.remiforge.dev/sample-job");
  assert.strictEqual(collectionParts(collections[1])?.[0]?.url, "https://www.remiforge.dev/sample-role");
  assert.strictEqual(collections[0]?.inLanguage, "pl");
});

it("education structured data describes attended schools, not credentials, inside a breadcrumb graph", () => {
  const head = educationHead({ pageTitles: stablePageTitles, educationList: sampleEducation, preferredLanguage: "en" });
  const graph = graphOf(head.scripts?.[0]?.children);
  // The page node gives the school list a container the way every other content page has one
  const collection = nodeOf(graph, "CollectionPage");
  assert.deepStrictEqual(collection?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.deepStrictEqual(collection?.breadcrumb, { "@id": "https://www.remiforge.dev/education#breadcrumb" });
  assert.deepStrictEqual(collection?.mainEntity, { "@id": "https://www.remiforge.dev/education#education-list" });
  const school = collectionParts(nodeOf(graph, "Collection"))?.[0];
  assert.strictEqual(school?.["@type"], "EducationalOrganization");
  assert.strictEqual(school?.name, "Pratt Institute");
  // Each school has a stable fragment id the person's alumniOf edges reference
  assert.strictEqual(school?.["@id"], "https://www.remiforge.dev/education#school-1");
  // The alumni edge links each school back to the person so AI systems can extract "studied at"
  assert.deepStrictEqual(school?.alumni, { "@id": "https://www.remiforge.dev/#person" });
  // The reciprocal edge on the person fragment makes "studied at" extractable from either direction
  assert.deepStrictEqual(personOf(graph)?.alumniOf, [{ "@id": "https://www.remiforge.dev/education#school-1" }]);
  assert.notInclude(JSON.stringify(graph), "EducationalOccupationalCredential");
  assert.strictEqual(listItems(nodeOf(graph, "BreadcrumbList"))?.[1]?.name, "Stable education title");

  // An empty education list keeps the page and trail without referencing a missing collection
  const empty = graphOf(educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en" }).scripts?.[0]?.children);
  assert.isTrue(empty.some((node) => node["@type"] === "CollectionPage"));
  assert.isFalse(empty.some((node) => node["@type"] === "Collection"));
  // The site Person is still present, but carries no alumni edge — an empty list adds no "studied at"
  assert.isDefined(personOf(empty));
  assert.isUndefined(personOf(empty)?.alumniOf);
  assert.isUndefined(nodeOf(empty, "CollectionPage")?.mainEntity);
});

it("contact structured data describes the visible ContactPage inside a breadcrumb graph", () => {
  const hostileTitle = "Stable </script> contact title.";
  const head = contactHead({
    pageTitles: { ...stablePageTitles, "/contact": { ...stablePageTitles["/contact"], heading: hostileTitle } },
    preferredLanguage: "pl",
  });
  const script = head.scripts?.[0]?.children ?? "{}";
  assert.notInclude(script, "</script>");
  assert.include(script, "\\u003C");
  const graph = graphOf(script);
  const contact = nodeOf(graph, "ContactPage");
  assert.strictEqual(contact?.name, hostileTitle);
  assert.strictEqual(contact?.description, "Skontaktuj się z Remim Forge w sprawie tworzenia stron internetowych, współpracy lub projektów.");
  assert.deepStrictEqual(contact?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.deepStrictEqual(contact?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(contact?.breadcrumb, { "@id": "https://www.remiforge.dev/contact#breadcrumb" });
  assert.notInclude(JSON.stringify(graph), "FAQPage");
  // The bilingual contact form is the machine-readable contact channel
  const person = personOf(graph);
  const contactPoint = nodeOf(graph, "ContactPoint");
  assert.deepStrictEqual(person?.contactPoint, { "@id": "https://www.remiforge.dev/contact#contact-point" });
  assert.strictEqual(contactPoint?.contactType, "author");
  assert.strictEqual(contactPoint?.url, "https://www.remiforge.dev/contact");
  assert.deepStrictEqual(contactPoint?.availableLanguage, ["en", "pl"]);
  // Two-level breadcrumb mirrors the site structure for SERP display and AI extraction
  const trail = nodeOf(graph, "BreadcrumbList");
  // The Home crumb must byte-match the homepage canonical and follow the page language
  assert.deepStrictEqual(listItems(trail)?.[0], { "@type": "ListItem", position: 1, name: "Strona główna", item: "https://www.remiforge.dev/" });
  assert.deepStrictEqual(listItems(trail)?.[1], {
    "@type": "ListItem",
    position: 2,
    name: hostileTitle,
    item: "https://www.remiforge.dev/contact",
  });
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

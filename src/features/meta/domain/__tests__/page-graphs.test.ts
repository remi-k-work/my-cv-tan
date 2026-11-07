// Direct unit tests for the page-specific JSON-LD graph assemblers in ./page-graphs, which also
// owns the shared page-node pair every content page leads with. Each assembler combines that pair
// with its own nodes and the collection subgraphs.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option, Schema, pipe } from "effect";

// domain
import { educationCollectionId, educationJsonLd, contactJsonLd, experienceCollections, experienceJsonLd, homeJsonLd, schoolSubgraph } from "../page-graphs";
import { EXPERIENCE_LIST_ID, PERSON_ID, PORTFOLIO_LIST_ID, PROFILE_ID, WEBSITE_ID } from "../nodes";
import { jsonLdGraph } from "../graph";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";

// constants
import { HOME_URL } from "../identity";

const language: PreferredLanguage = "en";

const employment: ExperienceList = [
  { type: "e", slug: "job-1", year: "2024", role: "Dev", company: "Co", txt: "Work.", skillsUsed: ["TypeScript"], imageName: "" },
];
const projects: ExperienceList = [{ type: "p", slug: "proj-1", year: "2025", role: "Art", company: "Co", txt: "Play.", skillsUsed: ["React"], imageName: "" }];

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

const findByType = <T extends Record<string, unknown>>(nodes: ReadonlyArray<T>, type: string, idFragment?: string) =>
  nodes.find((node) => node["@type"] === type && (idFragment === undefined || String(node["@id"]).endsWith(idFragment))) as T | undefined;

it("educationJsonLd assembles a CollectionPage with its school subgraph", () => {
  const nodes = educationJsonLd({
    pageName: "Education",
    description: "Schools and certificates.",
    educationList: sampleEducation,
    preferredLanguage: language,
  });

  const page = findByType(nodes, "CollectionPage");
  assert.isDefined(page);
  assert.deepStrictEqual(page?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.deepStrictEqual(page?.breadcrumb, { "@id": "https://www.remiforge.dev/education#breadcrumb" });
  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/education#education-list" });

  // Schools are nested inside the collection's hasPart, not top-level nodes
  const collection = findByType(nodes, "Collection");
  assert.isDefined(collection);
  const school = (collection as { readonly hasPart?: ReadonlyArray<Record<string, unknown>> })?.hasPart?.[0];
  assert.isDefined(school);
  assert.strictEqual(school?.name, "Pratt Institute");
  assert.deepStrictEqual(school?.alumni, { "@id": "https://www.remiforge.dev/#person" });
  assert.strictEqual(school?.["@id"], "https://www.remiforge.dev/education#school-1");

  const person = findByType(nodes, "Person");
  assert.deepStrictEqual(person?.alumniOf, [{ "@id": "https://www.remiforge.dev/education#school-1" }]);
});

it("educationJsonLd omits the collection when the school list is empty", () => {
  const nodes = educationJsonLd({
    pageName: "Education",
    description: "Schools and certificates.",
    educationList: [],
    preferredLanguage: language,
  });

  assert.isTrue(nodes.some((node) => node["@type"] === "CollectionPage"));
  assert.isFalse(nodes.some((node) => node["@type"] === "Collection"));
  assert.isUndefined(findByType(nodes, "CollectionPage")?.mainEntity);
});

it("contactJsonLd assembles a ContactPage with a ContactPoint and person edge", () => {
  const nodes = contactJsonLd({
    pageName: "Contact",
    description: "Get in touch.",
    preferredLanguage: language,
  });

  const page = findByType(nodes, "ContactPage");
  assert.isDefined(page);
  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });

  const contactPoint = findByType(nodes, "ContactPoint");
  assert.isDefined(contactPoint);
  assert.strictEqual(contactPoint?.contactType, "author");
  assert.strictEqual(contactPoint?.url, "https://www.remiforge.dev/contact");
  assert.deepStrictEqual(contactPoint?.availableLanguage, ["en", "pl"]);

  const person = findByType(nodes, "Person");
  assert.deepStrictEqual(person?.contactPoint, { "@id": "https://www.remiforge.dev/contact#contact-point" });
});

it("experienceJsonLd assembles WebPage, Article and the item node for a project", () => {
  const nodes = experienceJsonLd({
    experience: sampleExperience,
    preferredLanguage: language,
    path: "/sample-role",
    headline: "Full-Stack Developer",
    description: "Built things with care.",
    screenshot: Option.some({ src: "https://www.remiforge.dev/images/01-a.webp", mime: "image/webp", width: 1600, height: 900 }),
  });

  const page = findByType(nodes, "WebPage");
  const article = findByType(nodes, "Article");
  const project = findByType(nodes, "SoftwareSourceCode");

  assert.isDefined(page);
  assert.isDefined(article);
  assert.isDefined(project);

  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/sample-role#article" });
  assert.deepStrictEqual(article?.about, { "@id": "https://www.remiforge.dev/sample-role#project" });
  assert.deepStrictEqual(project?.mainEntityOfPage, { "@id": "https://www.remiforge.dev/sample-role" });
  assert.deepStrictEqual(project?.creator, { "@id": "https://www.remiforge.dev/#person" });
  assert.strictEqual(project?.codeRepository, "https://github.com/example/repo");
  assert.strictEqual(project?.inLanguage, language);
  assert.strictEqual(project?.keywords, "TypeScript, React");
  assert.deepStrictEqual(project?.image, {
    "@type": "ImageObject",
    url: "https://www.remiforge.dev/images/01-a.webp",
    width: 1600,
    height: 900,
  });
  // The Article points at the same verified picture, so a reader that only extracts Article
  // markup still learns the page's image without resolving the page's mainEntity
  assert.deepStrictEqual(article?.image, project?.image);
});

it("experienceJsonLd drops a repository URL that is not http(s)", () => {
  const nodes = experienceJsonLd({
    experience: { ...sampleExperience, gitHubLink: "javascript:alert(1)" },
    preferredLanguage: language,
    path: "/sample-role",
    headline: "Full-Stack Developer",
    description: "Built things with care.",
    screenshot: Option.none(),
  });

  // The source-code type is a claim that this page's code is published, so a repository URL the
  // site refuses to publish also removes the claim: the node is an ordinary creative work.
  const project = findByType(nodes, "CreativeWork");
  assert.isDefined(project);
  assert.isUndefined(findByType(nodes, "SoftwareSourceCode"));
  // The hostile scheme never reaches a crawler
  assert.isUndefined(project?.codeRepository);
  assert.notInclude(JSON.stringify(nodes), "javascript:");
});

it("experienceJsonLd drops the source-code type when the experience publishes no repository", () => {
  const nodes = experienceJsonLd({
    experience: { ...sampleExperience, gitHubLink: undefined },
    preferredLanguage: language,
    path: "/sample-role",
    headline: "Full-Stack Developer",
    description: "Built things with care.",
    screenshot: Option.none(),
  });

  assert.isDefined(findByType(nodes, "CreativeWork"));
  assert.isUndefined(findByType(nodes, "SoftwareSourceCode"));
});

it("experienceJsonLd uses OrganizationRole for employment type", () => {
  const employment = { ...sampleExperience, type: "e" as const, slug: "sample-job" };
  const nodes = experienceJsonLd({
    experience: employment,
    preferredLanguage: language,
    path: "/sample-job",
    headline: "Web Developer",
    description: "Work.",
    screenshot: Option.none(),
  });

  const role = findByType(nodes, "OrganizationRole");
  const organization = findByType(nodes, "Organization", "#organization");
  const article = findByType(nodes, "Article");

  assert.isDefined(role);
  assert.isDefined(organization);
  assert.isDefined(article);
  assert.deepStrictEqual(role?.member, { "@id": "https://www.remiforge.dev/#person" });
  // The employer claims the person, not the OrganizationRole node: Organization.member expects a
  // Person or Organization, and the role is already carried as the Article's subject.
  assert.deepStrictEqual(organization?.member, { "@id": "https://www.remiforge.dev/#person" });
  assert.isUndefined(role?.inLanguage);
  assert.deepStrictEqual(article?.about, { "@id": "https://www.remiforge.dev/sample-job#organization-role" });
});

it("homeJsonLd builds a ProfilePage linking site entities plus grouped collections", () => {
  const nodes = homeJsonLd({
    pageName: "Home",
    description: "A home page.",
    experienceList: [...employment, ...projects],
    preferredLanguage: language,
  });

  const profile = nodes.find((node) => node["@type"] === "ProfilePage");
  assert.deepStrictEqual(profile?.name, "Home");
  assert.deepStrictEqual(profile?.description, "A home page.");
  assert.strictEqual(profile?.["@id"], PROFILE_ID);
  assert.strictEqual(profile?.url, HOME_URL);
  assert.deepStrictEqual(profile?.mainEntity, { "@id": PERSON_ID });
  assert.deepStrictEqual(profile?.isPartOf, { "@id": WEBSITE_ID });
  // The homepage is the site root, so its page node has no redundant breadcrumb trail.
  assert.isUndefined(profile?.breadcrumb);

  const collections = nodes.filter((node) => node["@type"] === "Collection");
  assert.deepStrictEqual(
    collections.map((node) => node["@id"]),
    [EXPERIENCE_LIST_ID, PORTFOLIO_LIST_ID]
  );
});

// --- The collection subgraphs ---

// The two experience collections and the school list group content beside a page node. Each is
// exercised directly here and again through the page that renders it, so the grouping cannot drift
// between the two call sites.

const schools: EducationList = [{ name: "Pratt Institute", year: "• 2002 — 2004 •", location: "New York, US", info: "Interactive Media." }];

it("experienceCollections builds employment then portfolio collections", () => {
  const nodes = experienceCollections(employment, projects, language);

  const collections = nodes.filter((node) => node["@type"] === "Collection");
  assert.strictEqual(collections.length, 2);
  assert.deepStrictEqual(
    collections.map((node) => node.name),
    ["Experience", "Portfolio Projects"]
  );
  assert.deepStrictEqual(
    collections.map((node) => node["@id"]),
    [EXPERIENCE_LIST_ID, PORTFOLIO_LIST_ID]
  );
  assert.deepStrictEqual(
    collections.map((node) => node.inLanguage),
    [language, language]
  );

  // Each part references the detail page by @id and url with the translated headline, so the
  // collection and the page it names describe the same entity
  assert.deepStrictEqual(collections[0]?.hasPart, [
    { "@type": "WebPage", "@id": "https://www.remiforge.dev/job-1", url: "https://www.remiforge.dev/job-1", name: "Dev at Co" },
  ]);
});

it("experienceCollections omits empty collections", () => {
  const nodes = experienceCollections([], [], language);
  const collections = nodes.filter((node) => node["@type"] === "Collection");
  assert.strictEqual(collections.length, 0);
});

it("schoolSubgraph builds a school collection plus the Person alumniOf edge", () => {
  const url = "https://www.remiforge.dev/education";
  const nodes = schoolSubgraph(url, schools, language);

  const collection = nodes.find((node) => node["@type"] === "Collection");
  assert.deepStrictEqual(collection?.name, "Remi Forge — Education");
  assert.deepStrictEqual(collection?.hasPart, [
    {
      "@type": "EducationalOrganization",
      "@id": `${url}#school-1`,
      name: "Pratt Institute",
      description: "Interactive Media.",
      address: "New York, US",
      alumni: { "@id": "https://www.remiforge.dev/#person" },
    },
  ]);

  const edge = nodes.find((node) => node["@type"] === "Person" && node["alumniOf"]);
  assert.deepStrictEqual(edge?.alumniOf, [{ "@id": `${url}#school-1` }]);
});

it("schoolSubgraph returns nothing for an empty list", () => {
  assert.deepStrictEqual(schoolSubgraph("https://www.remiforge.dev/education", [], language), []);
});

it("educationCollectionId derives a stable fragment id from the page url", () => {
  assert.strictEqual(educationCollectionId("https://www.remiforge.dev/education"), "https://www.remiforge.dev/education#education-list");
});

// --- The shared page-node pair ---

// Four page graphs lead with exactly this pair, so the @id the breadcrumb hangs from and the
// isPartOf edge are decided in one place. These tests pin the invariant the four of them rely on:
// the page node, its trail and the site entity they both reference stay one addressable graph.

// Minimal reader, mirroring the one in structured-data.test.ts: a node is an open record because the
// assertions probe arbitrary fields, and a payload that fails to decode reads as an empty graph so
// the assertions below fail loudly instead of quietly reading `undefined` off a cast.
const JsonLdNode = Schema.Record(Schema.String, Schema.Unknown);
const decodeGraph = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Struct({ "@graph": Schema.Array(JsonLdNode) })));

const graphOf = (children: string | undefined) =>
  pipe(
    decodeGraph(children ?? "{}"),
    Option.map((document) => document["@graph"] as ReadonlyArray<Record<string, unknown>>),
    Option.getOrElse<ReadonlyArray<Record<string, unknown>>>(() => [])
  );

const nodeOf = (graph: ReadonlyArray<Record<string, unknown>>, type: string) => graph.find((node) => node["@type"] === type);

const graph = educationJsonLd({
  pageName: "Education",
  description: "Schools and certificates.",
  educationList: sampleEducation,
  preferredLanguage: "pl",
});

// Every subpage assembler's first two nodes: the page node, then its trail.
const subpagePairs: ReadonlyArray<ReadonlyArray<Record<string, unknown>>> = [
  graph,
  contactJsonLd({ pageName: "Contact", description: "Get in touch.", preferredLanguage: language }),
  experienceJsonLd({
    experience: sampleExperience,
    preferredLanguage: language,
    path: "/sample-role",
    headline: "Full-Stack Developer",
    description: "Built things with care.",
    screenshot: Option.none(),
  }),
];

it("the page node comes first and its breadcrumb trail second, so a parser reads page-entity-first", () => {
  // With an empty school list the education assembler emits the pair and nothing else.
  const bare = educationJsonLd({ pageName: "Education", description: "Schools and certificates.", educationList: [], preferredLanguage: "pl" });

  assert.strictEqual(bare.length, 2);
  assert.strictEqual(bare[0]?.["@type"], "CollectionPage");
  assert.strictEqual(bare[1]?.["@type"], "BreadcrumbList");

  for (const nodes of subpagePairs) {
    assert.notStrictEqual(nodes[0]?.["@type"], "BreadcrumbList");
    assert.strictEqual(nodes[1]?.["@type"], "BreadcrumbList");
  }
});

it("the trail's @id is the page node's @id plus a fragment, so the pair is one addressable entity", () => {
  const page = nodeOf(graph, "CollectionPage");
  const trail = nodeOf(graph, "BreadcrumbList");

  assert.strictEqual(page?.["@id"], "https://www.remiforge.dev/education");
  assert.deepStrictEqual(page?.["breadcrumb"], { "@id": "https://www.remiforge.dev/education#breadcrumb" });
  assert.strictEqual(trail?.["@id"], "https://www.remiforge.dev/education#breadcrumb");
  // The page references the trail by @id rather than embedding it, so a single parse pass resolves both
  assert.isUndefined(page?.itemListElement);
});

it("a page node keeps the site membership, language and main entity every route declares", () => {
  const page = nodeOf(graph, "CollectionPage");

  assert.deepStrictEqual(page?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.strictEqual(page?.inLanguage, "pl");
  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/education#education-list" });
  assert.strictEqual(page?.url, "https://www.remiforge.dev/education");
  // The same string as the @id, so the two spellings of the page can never disagree
  assert.strictEqual(page?.["url"], page?.["@id"]);
});

it("every subpage graph publishes a URL, because the page node derives it from the path", () => {
  // A node whose only URL spelling is a host-rooted @id costs a parser a second lookup. Walk the
  // three shapes the real callers use — CollectionPage, ContactPage and WebPage — and require each
  // page node to carry the absolute URL of the page it describes.
  for (const nodes of subpagePairs) {
    const page = nodes[0];

    assert.strictEqual(page?.["url"], page?.["@id"]);
    assert.isString(page?.["url"]);
  }
});

it("the page-node pair merges into the site entities as one document when a page head publishes it", () => {
  // The real usage: pageHead calls jsonLdGraph([...siteNodes, ...contactJsonLd(...)]), and the pair
  // must survive the merge as two distinct nodes rather than folding into one another.
  const merged = graphOf(
    jsonLdGraph([{ "@type": "WebSite", "@id": "https://www.remiforge.dev/#website" }, ...contactJsonLd({ pageName: "Contact", description: "Get in touch.", preferredLanguage: language })])
      .children
  );

  assert.strictEqual(merged.filter((node) => node["@type"] === "BreadcrumbList").length, 1);
  assert.strictEqual(merged.filter((node) => node["@type"] === "ContactPage").length, 1);
  assert.isDefined(nodeOf(merged, "WebSite"));
});

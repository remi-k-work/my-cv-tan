// Direct unit tests for the JSON-LD collection builders in ./collections.
// Experience lists split into employment and portfolio; school lists group
// attended institutions. All builders are pure.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";

// domain
import { experienceCollections, schoolSubgraph, educationCollectionId } from "../collections";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { ExperienceList } from "@/features/experience/domain/models";

// constants
import { EXPERIENCE_LIST_ID, PORTFOLIO_LIST_ID } from "../constants";

const language: PreferredLanguage = "en";

const employment: ExperienceList = [
  { type: "e", slug: "job-1", year: "2024", role: "Dev", company: "Co", txt: "Work.", skillsUsed: ["TypeScript"], imageName: "" },
];
const projects: ExperienceList = [{ type: "p", slug: "proj-1", year: "2025", role: "Art", company: "Co", txt: "Play.", skillsUsed: ["React"], imageName: "" }];

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

  const employmentParts = collections[0]?.hasPart;
  assert.deepStrictEqual(employmentParts, [
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

  const personEdge = nodes.find((node) => node["@type"] === "Person" && node["alumniOf"]);
  assert.deepStrictEqual(personEdge?.alumniOf, [{ "@id": `${url}#school-1` }]);
});

it("schoolSubgraph returns nothing for an empty list", () => {
  assert.deepStrictEqual(schoolSubgraph("https://www.remiforge.dev/education", [], language), []);
});

it("educationCollectionId derives a stable fragment id from the page url", () => {
  assert.strictEqual(educationCollectionId("https://www.remiforge.dev/education"), "https://www.remiforge.dev/education#education-list");
});

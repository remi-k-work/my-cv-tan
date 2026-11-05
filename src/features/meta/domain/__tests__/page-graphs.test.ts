// Direct unit tests for the page-specific JSON-LD graph assemblers in ./page-graphs.
// Each assembles a complete subgraph for one page kind from the page node
// (./page-node) plus page-unique nodes.

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";

// domain
import { educationJsonLd, contactJsonLd, experienceJsonLd, homeJsonLd } from "../page-graphs";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { EducationList } from "@/features/education/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";

// constants
import { EXPERIENCE_LIST_ID, HOME_URL, PERSON_ID, PORTFOLIO_LIST_ID, PROFILE_ID, WEBSITE_ID } from "../constants";

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

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";

// domain
import { canonicalLink, experienceHead, educationListJsonLd, hreflangLinks, yearToIso } from "../index";

// types
import type { EducationList } from "@/features/education/domain";
import type { Experience } from "@/features/experience/domain";

const sampleExperience: Experience = {
  type: "p",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with care.",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

const sampleEducation: EducationList = [{ name: "Pratt Institute", year: "• 2002 — 2004 •", location: "New York, US", info: "Interactive Media." }];

it("yearToIso reduces strict labels to ISO 8601 and rejects prose", () => {
  assert.deepStrictEqual(yearToIso("2008"), Option.some("2008"));
  assert.deepStrictEqual(yearToIso("Mar 2026"), Option.some("2026-03"));
  assert.deepStrictEqual(yearToIso("Too Long"), Option.none());
  assert.deepStrictEqual(yearToIso("2008, 2009"), Option.none());
});

it("experienceHead emits article:published_time only when the year is ISO-reducible", () => {
  const dated = JSON.stringify(experienceHead("sample-role", sampleExperience));
  assert.include(dated, "article:published_time");
  assert.include(dated, "2026-03");
  assert.include(dated, "article:tag");

  const undated = JSON.stringify(experienceHead("sample-role", { ...sampleExperience, year: "Too Long" }));
  assert.notInclude(undated, "article:published_time");
});

it("canonical and hreflang links always point at the absolute URL", () => {
  assert.deepStrictEqual(canonicalLink("/education"), { rel: "canonical", href: "https://www.remiforge.dev/education" });
  assert.deepStrictEqual(
    hreflangLinks("/").map((link) => link.hrefLang),
    ["en", "pl", "x-default"]
  );
});

it("educationListJsonLd describes attended schools, not credentials", () => {
  // jsonLdScript nests the graph as a JSON string inside the script children
  const graph = (educationListJsonLd(sampleEducation) as { children: string }).children;
  assert.include(graph, `"@type":"EducationalOrganization"`);
  assert.include(graph, `"name":"Pratt Institute"`);
  assert.notInclude(graph, "EducationalOccupationalCredential");
});

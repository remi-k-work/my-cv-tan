// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";

// domain
import { canonicalLink, educationListJsonLd, experienceHead, hreflangLinks, languageFromMatches, yearToIso } from "../index";

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
  const dated = JSON.stringify(experienceHead({ slug: "sample-role", experience: sampleExperience, preferredLanguage: "en" }));
  assert.include(dated, "article:published_time");
  assert.include(dated, "2026-03");
  assert.include(dated, "article:tag");

  const undated = JSON.stringify(experienceHead({ slug: "sample-role", experience: { ...sampleExperience, year: "Too Long" }, preferredLanguage: "en" }));
  assert.notInclude(undated, "article:published_time");
});

it("experienceHead renders og:locale from the resolved language and merges Article + BreadcrumbList into one graph", () => {
  const pl = experienceHead({ slug: "sample-role", experience: sampleExperience, preferredLanguage: "pl" });
  const html = JSON.stringify(pl);
  assert.include(html, '"content":"pl_PL"');
  assert.include(html, '"content":"en_US"'); // alternate

  // JSON-LD lives in a single script whose children is the serialized @graph
  const [graph] = pl.scripts ?? [];
  assert.include(graph?.children, `"@type":"Article"`);
  assert.include(graph?.children, `"@type":"BreadcrumbList"`);
  assert.include(graph?.children, `"inLanguage":"pl"`);
  assert.include(graph?.children, `"keywords":"TypeScript, React"`);
});

it("canonical and hreflang links always point at the absolute URL", () => {
  assert.deepStrictEqual(canonicalLink("/education"), { rel: "canonical", href: "https://www.remiforge.dev/education" });
  assert.deepStrictEqual(
    hreflangLinks("/").map((link) => link.hrefLang),
    ["en", "pl", "x-default"]
  );
});

it("educationListJsonLd describes attended schools, not credentials", () => {
  const graph = educationListJsonLd(sampleEducation).children;
  assert.include(graph, `"@type":"EducationalOrganization"`);
  assert.include(graph, `"name":"Pratt Institute"`);
  assert.notInclude(graph, "EducationalOccupationalCredential");
});

it("languageFromMatches validates the root loader payload and falls back safely", () => {
  assert.deepStrictEqual(languageFromMatches([{ loaderData: { preferredLanguage: "pl" } }]), Option.some("pl"));
  assert.deepStrictEqual(languageFromMatches([{ loaderData: { preferredLanguage: "de" } }]), Option.none());
  assert.deepStrictEqual(languageFromMatches([]), Option.none());
});

it("JSON-LD children escape < so content can never break out of the script tag", () => {
  const hostile = experienceHead({
    slug: "sample-role",
    experience: { ...sampleExperience, txt: "evil </script><script>alert(1)</script>" },
    preferredLanguage: "en",
  });
  const [graph] = hostile.scripts ?? [];
  assert.notInclude(graph?.children, "</script>");
  assert.include(graph?.children, "\\u003C");
  // The escape is transparent: parsers still see the original text
  const parsed = JSON.parse(graph?.children ?? "{}") as { "@graph": Array<{ description: string }> };
  assert.include(parsed["@graph"][0].description, "</script>");
});

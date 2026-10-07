// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";

// domain
import {
  buildSitemapXml,
  canonicalLink,
  contactHead,
  educationHead,
  experienceHead,
  homeListHead,
  languageFromMatches,
  ROOT_HEAD,
  sitemapUnavailableResponse,
} from "../index";

// Minimal JSON-LD graph readers for structured-data assertions
const graphOf = (children: string | undefined) => (JSON.parse(children ?? "{}") as { "@graph"?: Array<Record<string, unknown>> })["@graph"] ?? [];
const nodeOf = (graph: ReadonlyArray<Record<string, unknown>>, type: string) => graph.find((node) => node["@type"] === type);
const listItems = (node: Record<string, unknown> | undefined) => (node as { itemListElement?: Array<Record<string, unknown>> } | undefined)?.itemListElement;

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

const stablePageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

it("experienceHead never treats project or employment years as publication dates", () => {
  const dated = JSON.stringify(experienceHead({ slug: "sample-role", experience: sampleExperience, preferredLanguage: "en" }));
  assert.notInclude(dated, "article:published_time");
  assert.notInclude(dated, "datePublished");
  assert.include(dated, "article:tag");

  const undated = JSON.stringify(experienceHead({ slug: "sample-role", experience: { ...sampleExperience, year: "Too Long" }, preferredLanguage: "en" }));
  assert.notInclude(undated, "article:published_time");
  assert.notInclude(undated, "datePublished");
});

it("root metadata defaults to noindex and complete page heads explicitly allow indexing", () => {
  assert.include(JSON.stringify(ROOT_HEAD.meta), '"content":"noindex, follow"');

  const indexable = homeListHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" });
  assert.include(JSON.stringify(indexable.meta), "index, follow, max-image-preview:large");
  assert.notInclude(JSON.stringify(indexable.meta), "noindex");

  const emptyEducation = educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "pl" });
  assert.include(JSON.stringify(emptyEducation.meta), "index, follow, max-image-preview:large");

  const contact = contactHead({ pageTitles: stablePageTitles, preferredLanguage: "en" });
  assert.include(JSON.stringify(contact.meta), "index, follow, max-image-preview:large");
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

it("localized metadata uses stable copy and emits canonical plus Markdown links without same-URL hreflang", () => {
  assert.deepStrictEqual(canonicalLink("/education"), { rel: "canonical", href: "https://www.remiforge.dev/education" });

  const head = homeListHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "pl" });
  const html = JSON.stringify(head);
  assert.include(html, "Stable home title");
  assert.include(html, "Stable home description.");
  assert.include(html, '"content":"pl_PL"');
  assert.include(html, "https://www.remiforge.dev/index.md");
  assert.notInclude(html, "hrefLang");
  assert.deepStrictEqual(
    head.links?.map(({ rel }) => rel),
    ["canonical", "alternate"]
  );
  assert.strictEqual(head.links?.[0]?.href, "https://www.remiforge.dev/");
});

it("home structured data is a first-party ProfilePage linking site entities plus the work ItemList", () => {
  const head = homeListHead({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en" });
  const graph = graphOf(head.scripts?.[0]?.children);
  const profile = nodeOf(graph, "ProfilePage");
  assert.deepStrictEqual(profile?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(profile?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.strictEqual(listItems(nodeOf(graph, "ItemList"))?.[0]?.url, "https://www.remiforge.dev/sample-role");

  // An empty portfolio still emits the ProfilePage graph, never a misleading empty ItemList
  const emptyGraph = graphOf(homeListHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }).scripts?.[0]?.children);
  assert.isTrue(emptyGraph.some((node) => node["@type"] === "ProfilePage"));
  assert.isFalse(emptyGraph.some((node) => node["@type"] === "ItemList"));
});

it("contact structured data describes the visible ContactPage inside a breadcrumb graph", () => {
  const hostileDescription = "Stable </script> contact description.";
  const head = contactHead({
    pageTitles: { ...stablePageTitles, "/contact": { ...stablePageTitles["/contact"], intro: hostileDescription } },
    preferredLanguage: "pl",
  });
  const script = head.scripts?.[0]?.children ?? "{}";
  assert.notInclude(script, "</script>");
  assert.include(script, "\\u003C");
  const graph = graphOf(script);
  const contact = nodeOf(graph, "ContactPage");
  assert.strictEqual(contact?.name, "Stable contact title");
  assert.strictEqual(contact?.description, hostileDescription);
  assert.deepStrictEqual(contact?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.deepStrictEqual(contact?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
  assert.notInclude(JSON.stringify(graph), "FAQPage");
  // Two-level breadcrumb mirrors the site structure for SERP display and AI extraction
  const trail = nodeOf(graph, "BreadcrumbList");
  assert.deepStrictEqual(listItems(trail)?.[1], {
    "@type": "ListItem",
    position: 2,
    name: "Stable contact title",
    item: "https://www.remiforge.dev/contact",
  });
});

it("sitemap omits fabricated last-modified dates", () => {
  const xml = buildSitemapXml([sampleExperience]);
  assert.include(xml, "https://www.remiforge.dev/sample-role");
  assert.notInclude(xml, "<lastmod>");
});

it("sitemap escapes XML special characters in generated URLs", () => {
  const xml = buildSitemapXml([{ ...sampleExperience, slug: `danger<&>"'` }]);
  assert.include(xml, "https://www.remiforge.dev/danger&lt;&amp;&gt;&quot;&apos;");
  assert.notInclude(xml, "<loc>https://www.remiforge.dev/danger<&>");
});

it("sitemap data failures return non-cacheable noindex XML with status 503", () => {
  const response = sitemapUnavailableResponse();
  assert.strictEqual(response.status, 503);
  assert.strictEqual(response.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
});

it("education structured data describes attended schools, not credentials, inside a breadcrumb graph", () => {
  const head = educationHead({ pageTitles: stablePageTitles, educationList: sampleEducation, preferredLanguage: "en" });
  const graph = graphOf(head.scripts?.[0]?.children);
  const school = (listItems(nodeOf(graph, "ItemList"))?.[0] as { item?: Record<string, unknown> } | undefined)?.item;
  assert.strictEqual(school?.["@type"], "EducationalOrganization");
  assert.strictEqual(school?.name, "Pratt Institute");
  assert.notInclude(JSON.stringify(graph), "EducationalOccupationalCredential");
  assert.strictEqual(listItems(nodeOf(graph, "BreadcrumbList"))?.[1]?.name, "Stable education title");
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

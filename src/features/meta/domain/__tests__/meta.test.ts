// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { contactHead, educationHead, experienceHead, homeHead } from "../heads";
import { ROOT_HEAD } from "../root";
import { canonicalLink } from "../url";
import { STATIC_PAGES } from "../static-pages";
import { buildSitemapXml } from "../sitemap";
import { sitemapResponse, sitemapUnavailableResponse } from "../response";
import { ROBOTS_TXT } from "../robots";
import { languageFromMatches } from "../language";

import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW, PERSON_DESCRIPTION, SITE_DESCRIPTION } from "../constants";

// Minimal JSON-LD graph readers for structured-data assertions
const graphOf = (children: string | undefined) => (JSON.parse(children ?? "{}") as { "@graph"?: Array<Record<string, unknown>> })["@graph"] ?? [];
const nodeOf = (graph: ReadonlyArray<Record<string, unknown>>, type: string) => graph.find((node) => node["@type"] === type);
const listItems = (node: Record<string, unknown> | undefined) => (node as { itemListElement?: Array<Record<string, unknown>> } | undefined)?.itemListElement;
// Grouped page/school references carried by Collection nodes (the non-carousel replacement for ItemList)
const collectionParts = (node: Record<string, unknown> | undefined) => (node as { hasPart?: Array<Record<string, unknown>> } | undefined)?.hasPart;

// types
import type { EducationList } from "@/features/education/domain/models";
import type { Experience } from "@/features/experience/domain/models";

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

const stablePageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

it("experienceHead omits unsupported publication dates and keyword meta", () => {
  const dated = JSON.stringify(experienceHead({ experience: sampleExperience, preferredLanguage: "en" }));
  assert.notInclude(dated, "article:published_time");
  assert.notInclude(dated, "datePublished");
  assert.notInclude(dated, '"name":"keywords"');
  assert.notInclude(dated, "article:tag");

  const undated = JSON.stringify(experienceHead({ experience: { ...sampleExperience, year: "Too Long" }, preferredLanguage: "en" }));
  assert.notInclude(undated, "article:published_time");
  assert.notInclude(undated, "datePublished");
});

it("root metadata defaults to noindex and complete page heads explicitly allow indexing", () => {
  assert.include(JSON.stringify(ROOT_HEAD.meta), `"content":"${NOINDEX_FOLLOW}"`);
  // iOS and high-DPI search previews resolve the touch icon site-wide, alongside the SVG favicon
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"apple-touch-icon"');
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/avatar.jpg");
  // rel="me" identity links mirror the JSON-LD sameAs profiles for verifiers
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"me"');
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://github.com/remi-k-work");
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://linkedin.com/in/remi-k-work");

  const indexable = homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" });
  // TanStack reads only top-level meta/links off head results (load-server.js): the shape must stay flat
  assert.isDefined(indexable.meta);
  assert.isDefined(indexable.links);
  assert.include(JSON.stringify(indexable.meta), INDEXABLE_ROBOTS);
  assert.notInclude(JSON.stringify(indexable.meta), "noindex");
  assert.notInclude(JSON.stringify(indexable.meta), '"name":"keywords"');

  const emptyEducation = educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "pl" });
  assert.include(JSON.stringify(emptyEducation.meta), INDEXABLE_ROBOTS);

  const contact = contactHead({ pageTitles: stablePageTitles, preferredLanguage: "en" });
  assert.include(JSON.stringify(contact.meta), INDEXABLE_ROBOTS);
});

it("root graph declares the bilingual audience on WebSite and Person", () => {
  const graph = graphOf(ROOT_HEAD.scripts?.[0]?.children);
  assert.deepStrictEqual(nodeOf(graph, "WebSite")?.inLanguage, ["en", "pl"]);
  assert.deepStrictEqual(nodeOf(graph, "Person")?.knowsLanguage, ["en", "pl"]);
  // Every root entity carries an extractable description, single-sourced with the meta tags
  assert.strictEqual(nodeOf(graph, "WebSite")?.description, SITE_DESCRIPTION);
  assert.strictEqual(nodeOf(graph, "Person")?.description, PERSON_DESCRIPTION);
  assert.include(JSON.stringify(ROOT_HEAD.meta), SITE_DESCRIPTION);
  // The logo and person image are the square avatar with real dimensions, not the wide OG banner
  assert.deepStrictEqual(nodeOf(graph, "Organization")?.logo, { "@type": "ImageObject", url: "https://www.remiforge.dev/avatar.jpg", width: 288, height: 288 });
  assert.deepStrictEqual(nodeOf(graph, "Person")?.image, { "@type": "ImageObject", url: "https://www.remiforge.dev/avatar.jpg", width: 288, height: 288 });
});

it("project details use SoftwareSourceCode linked to the canonical WebPage, person and breadcrumb", () => {
  const pl = experienceHead({ experience: sampleExperience, preferredLanguage: "pl" });
  const html = JSON.stringify(pl);
  assert.include(html, '"content":"pl_PL"');
  assert.include(html, '"content":"en_US"'); // alternate
  assert.include(html, '"property":"og:type","content":"website"');
  // og:image carries the webp screenshot with real dimensions; X/Twitter falls back to the global jpeg
  assert.include(html, '"property":"og:image:type","content":"image/webp"');
  assert.include(html, '"property":"og:image:width","content":"1600"');
  assert.include(html, '"property":"og:image:height","content":"900"');
  assert.include(html, '"name":"twitter:image","content":"https://www.remiforge.dev/opengraph-image.jpg"');
  // og:title carries the bare headline; the document <title> keeps the site prefix
  assert.include(html, '"title":"Remi Forge ● Projekt osobisty: Full-Stack Developer"');
  assert.include(html, '"property":"og:title","content":"Projekt osobisty: Full-Stack Developer"');

  const [graph] = pl.scripts ?? [];
  const parsed = graphOf(graph?.children);
  const page = nodeOf(parsed, "WebPage");
  const project = nodeOf(parsed, "SoftwareSourceCode");
  assert.isDefined(page);
  assert.isDefined(project);
  assert.isFalse(parsed.some((node) => node["@type"] === "Article"));
  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/sample-role#project" });
  // The page node references its trail by @id, associating both the way Google expects
  assert.deepStrictEqual(page?.breadcrumb, { "@id": "https://www.remiforge.dev/sample-role#breadcrumb" });
  assert.strictEqual(nodeOf(parsed, "BreadcrumbList")?.["@id"], "https://www.remiforge.dev/sample-role#breadcrumb");
  assert.deepStrictEqual(project?.mainEntityOfPage, { "@id": "https://www.remiforge.dev/sample-role" });
  assert.deepStrictEqual(project?.creator, { "@id": "https://www.remiforge.dev/#person" });
  assert.strictEqual(project?.inLanguage, "pl");
  assert.strictEqual(project?.keywords, "TypeScript, React");
  // Schema.org's link to the source repository, single-sourced from the content's GitHub URL
  assert.strictEqual(project?.codeRepository, "https://github.com/example/repo");
  // The image is a sized ImageObject: scrapers learn the dimensions without fetching the file
  assert.deepStrictEqual(project?.image, { "@type": "ImageObject", url: "https://www.remiforge.dev/images/01-a.webp", width: 1600, height: 900 });
  assert.isDefined(nodeOf(parsed, "BreadcrumbList"));
});

it("employment details use OrganizationRole linked to the person and canonical WebPage without fabricated dates", () => {
  const experience = { ...sampleExperience, type: "e" as const, slug: "sample-job" };
  const head = experienceHead({ experience, preferredLanguage: "en" });
  const parsed = graphOf(head.scripts?.[0]?.children);
  const page = nodeOf(parsed, "WebPage");
  const role = nodeOf(parsed, "OrganizationRole");
  const organization = nodeOf(parsed, "Organization");

  assert.isDefined(role);
  assert.strictEqual(role?.inLanguage, "en");
  assert.deepStrictEqual(page?.mainEntity, { "@id": "https://www.remiforge.dev/sample-job#organization-role" });
  assert.deepStrictEqual(role?.member, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(role?.mainEntityOfPage, { "@id": "https://www.remiforge.dev/sample-job" });
  assert.strictEqual(organization?.name, "Sample Co");
  assert.deepStrictEqual(organization?.member, { "@id": "https://www.remiforge.dev/sample-job#organization-role" });
  assert.notInclude(JSON.stringify(role), "startDate");
  assert.notInclude(JSON.stringify(role), "endDate");
  // Employment pages render screenshots too, so their WebPage claims the same main image
  assert.deepStrictEqual(page?.primaryImageOfPage, { "@type": "ImageObject", url: "https://www.remiforge.dev/images/01-a.webp", width: 1600, height: 900 });
});

it("experience pages claim the screenshot as their main image only when one exists", () => {
  const withShot = graphOf(experienceHead({ experience: sampleExperience, preferredLanguage: "en" }).scripts?.[0]?.children);
  assert.deepStrictEqual(nodeOf(withShot, "WebPage")?.primaryImageOfPage, {
    "@type": "ImageObject",
    url: "https://www.remiforge.dev/images/01-a.webp",
    width: 1600,
    height: 900,
  });

  // No screenshot on the page: no main-image claim, and og:image falls back to the share banner
  const bareHead = experienceHead({ experience: { ...sampleExperience, imageName: "" }, preferredLanguage: "en" });
  assert.isUndefined(nodeOf(graphOf(bareHead.scripts?.[0]?.children), "WebPage")?.primaryImageOfPage);
  assert.include(JSON.stringify(bareHead.meta), "https://www.remiforge.dev/opengraph-image.jpg");
});

it("experience URL construction percent-encodes one slug consistently in canonical, social, alternate and JSON-LD URLs", () => {
  const slug = "résumé & more";
  const encodedPath = "/r%C3%A9sum%C3%A9%20%26%20more";
  const head = experienceHead({ experience: { ...sampleExperience, slug }, preferredLanguage: "en" });
  const html = JSON.stringify(head);
  const graph = graphOf(head.scripts?.[0]?.children);
  const page = nodeOf(graph, "WebPage");

  assert.strictEqual(head.links?.[0]?.href, `https://www.remiforge.dev${encodedPath}`);
  assert.strictEqual(head.links?.[1]?.href, `https://www.remiforge.dev${encodedPath}.md`);
  assert.include(html, `"property":"og:url","content":"https://www.remiforge.dev${encodedPath}"`);
  assert.strictEqual(page?.["@id"], `https://www.remiforge.dev${encodedPath}`);
});

it("localized metadata uses authored SEO copy and emits canonical plus Markdown links", () => {
  assert.deepStrictEqual(canonicalLink("https://www.remiforge.dev/education"), { rel: "canonical", href: "https://www.remiforge.dev/education" });

  const head = homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "pl" });
  const html = JSON.stringify(head);
  assert.include(html, "Stable home title");
  assert.include(html, STATIC_PAGES["/"].metadata.pl.description);
  assert.include(html, `Remi Forge ● ${STATIC_PAGES["/"].metadata.pl.title}`);
  assert.include(html, '"content":"pl_PL"');
  assert.include(html, "https://www.remiforge.dev/index.md");
  assert.notInclude(html, "hrefLang");
  assert.deepStrictEqual(
    head.links?.map(({ rel }) => rel),
    ["canonical", "alternate"]
  );
  assert.strictEqual(head.links?.[0]?.href, "https://www.remiforge.dev/");
});

it("home structured data is a first-party ProfilePage linking site entities plus grouped content collections", () => {
  const head = homeHead({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en" });
  const graph = graphOf(head.scripts?.[0]?.children);
  const profile = nodeOf(graph, "ProfilePage");
  assert.deepStrictEqual(profile?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(profile?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  // Collection nodes carry stable @ids like every other entity in the graph; the sample is a
  // project, so the employment group is absent and only the portfolio collection renders
  const portfolio = nodeOf(graph, "Collection");
  assert.strictEqual(portfolio?.["@id"], "https://www.remiforge.dev/#portfolio-list");
  assert.strictEqual(portfolio?.inLanguage, "en");
  assert.strictEqual(portfolio?.name, "Portfolio Projects");
  // Each part references the detail page with the same translated headline the page shows, in slider order
  assert.deepStrictEqual(collectionParts(portfolio), [{ "@type": "WebPage", url: "https://www.remiforge.dev/sample-role", name: "Full-Stack Developer" }]);

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
  assert.strictEqual(contact?.description, STATIC_PAGES["/contact"].metadata.pl.description);
  assert.deepStrictEqual(contact?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.deepStrictEqual(contact?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
  assert.deepStrictEqual(contact?.breadcrumb, { "@id": "https://www.remiforge.dev/contact#breadcrumb" });
  assert.notInclude(JSON.stringify(graph), "FAQPage");
  // The bilingual contact form is the machine-readable contact channel
  const person = nodeOf(graph, "Person");
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

it("sitemap omits fabricated last-modified dates and leads with the canonical homepage", () => {
  const xml = buildSitemapXml([sampleExperience]);
  assert.include(xml, "https://www.remiforge.dev/sample-role");
  assert.notInclude(xml, "<lastmod>");
  // Soft crawl signal: static canonicals (homepage first) precede the detail pages
  assert.isTrue(xml.indexOf("<loc>https://www.remiforge.dev/</loc>") < xml.indexOf("<loc>https://www.remiforge.dev/sample-role</loc>"));
});

it("sitemap home URL equals the homepage canonical exactly", () => {
  const xml = buildSitemapXml([]);
  assert.include(xml, "<loc>https://www.remiforge.dev/</loc>");
  assert.notInclude(xml, "<loc>https://www.remiforge.dev</loc>");
});

it("sitemap success responses carry the XML content type, noindex, and hour-long public caching", () => {
  const ok = sitemapResponse(buildSitemapXml([sampleExperience]));
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(ok.headers.get("Cache-Control"), "public, max-age=3600, stale-while-revalidate=86400");
  // The sitemap itself is not a search result, but must stay crawlable
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), "noindex, follow");
});

it("sitemap percent-encodes unsafe slug characters in generated URLs", () => {
  const xml = buildSitemapXml([{ ...sampleExperience, slug: `danger<&>"'` }]);
  assert.include(xml, "https://www.remiforge.dev/danger%3C%26%3E%22&apos;");
  assert.notInclude(xml, "<loc>https://www.remiforge.dev/danger<&>");
});

it("sitemap data failures return non-cacheable noindex XML with status 503", () => {
  const response = sitemapUnavailableResponse();
  assert.strictEqual(response.status, 503);
  assert.strictEqual(response.headers.get("Content-Type"), "application/xml; charset=utf-8");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
});

it("robots.txt allows content, disallows API endpoints, and advertises the sitemap", () => {
  const robots = ROBOTS_TXT;
  assert.include(robots, "User-agent: *");
  assert.include(robots, "Allow: /");
  assert.include(robots, "Allow: /*.md");
  // Form/RPC endpoints are not content, so they stay out of crawl budgets
  assert.include(robots, "Disallow: /api");
  assert.include(robots, "Sitemap: https://www.remiforge.dev/sitemap.xml");
  // Content signals state how accessed content may be reused: all three uses allowed site-wide
  assert.include(robots, "Content-Signal: search=yes, ai-input=yes, ai-train=yes");
  // AI search, user-initiated browsing, and training crawlers each get an explicit named allowance
  for (const bot of [
    "OAI-SearchBot",
    "Claude-SearchBot",
    "PerplexityBot",
    "ChatGPT-User",
    "Claude-User",
    "Perplexity-User",
    "GPTBot",
    "ClaudeBot",
    "CCBot",
    "Google-Extended",
    "Applebot-Extended",
  ]) {
    assert.include(robots, `User-agent: ${bot}`);
  }
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
  assert.deepStrictEqual(nodeOf(graph, "Person")?.alumniOf, [{ "@id": "https://www.remiforge.dev/education#school-1" }]);
  assert.notInclude(JSON.stringify(graph), "EducationalOccupationalCredential");
  assert.strictEqual(listItems(nodeOf(graph, "BreadcrumbList"))?.[1]?.name, "Stable education title");

  // An empty education list keeps the page and trail without referencing a missing collection
  const empty = graphOf(educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en" }).scripts?.[0]?.children);
  assert.isTrue(empty.some((node) => node["@type"] === "CollectionPage"));
  assert.isFalse(empty.some((node) => node["@type"] === "Collection"));
  assert.isFalse(empty.some((node) => node["@type"] === "Person"));
  assert.isUndefined(nodeOf(empty, "CollectionPage")?.mainEntity);
});

it("languageFromMatches validates the root loader payload and falls back safely", () => {
  assert.deepStrictEqual(languageFromMatches([{ loaderData: { preferredLanguage: "pl" } }]), Option.some("pl"));
  assert.deepStrictEqual(languageFromMatches([{ loaderData: { preferredLanguage: "de" } }]), Option.none());
  assert.deepStrictEqual(languageFromMatches([]), Option.none());
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
  const parsed = JSON.parse(graph?.children ?? "{}") as { "@graph": Array<{ description: string }> };
  assert.include(parsed["@graph"][0].description, "</script>");
});

// Direct unit tests for the shared page head layout in ./page-head.
// `pageHead` merges title, indexing directives, social cards, links and the
// JSON-LD graph into one PageHead. `experienceHead` and the static page
// heads all build on it.

import { assert, it } from "@effect/vitest";
import { Option, Schema, pipe } from "effect";
import { pageHead, experienceHead, contactHead, educationHead, homeHead } from "../page-head";
import { globalSocialImage } from "../social-meta";
import { BRANDED_TITLE, GLOBAL_SOCIAL_IMAGE, SITE_NAME, AUTHOR_URL, PROFILE_ID } from "../site";
import { INDEXABLE_ROBOTS } from "@/domain/http";
import { STATIC_PAGES } from "../pages";
import { withLanguageParam } from "../urls";
import { canonicalLink } from "../link-tags";
import type { JsonLdNodes, PageHead, SocialMetaInput } from "../models";
import type { PageTitles, PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { EducationList } from "@/features/education/domain/models";

const language: PreferredLanguage = "en";

const social: SocialMetaInput = {
  title: "Headline",
  description: "Description.",
  canonical: "https://www.remiforge.dev/test",
  image: globalSocialImage(language),
  preferredLanguage: language,
};

const graph: JsonLdNodes = [{ "@type": "WebPage", "@id": "https://www.remiforge.dev/test", name: "Test" }];

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

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

const metaOf = (head: PageHead) => JSON.parse(JSON.stringify(head.meta)) as ReadonlyArray<Record<string, string>>;

// Finds a tag by its property or name and returns its content, or undefined when absent.
const tagContent = (tags: ReadonlyArray<Record<string, string>>, key: "property" | "name", value: string) => tags.find((tag) => tag[key] === value)?.content;

// JSON-LD graph reader mirroring the one in helpers.test.ts
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

const sampleEducation: EducationList = [{ name: "Pratt Institute", year: "• 2002 — 2004 •", location: "New York, US", info: "Interactive Media." }];

it("pageHead builds a flat head with title, description, robots and social tags", () => {
  const head = pageHead({ social, markdownPath: "/test.md", graph });
  const tags = metaOf(head);

  assert.deepStrictEqual(head.meta?.[0], { title: BRANDED_TITLE("Headline") });
  assert.strictEqual(tagContent(tags, "name", "description"), "Description.");
  assert.strictEqual(tagContent(tags, "name", "robots"), INDEXABLE_ROBOTS);
  assert.strictEqual(tagContent(tags, "property", "og:title"), "Headline");
  assert.strictEqual(tagContent(tags, "property", "og:description"), "Description.");
  // title + description + robots + social tags (og + twitter + alternate locales)
  assert.strictEqual(head.meta.length, 22);
});

it("pageHead publishes the page's own canonical and Markdown alternate links", () => {
  const head = pageHead({ social, markdownPath: "/test.md", graph });

  assert.deepStrictEqual(head.links?.[0], { rel: "canonical", href: "https://www.remiforge.dev/test" });
  assert.deepStrictEqual(head.links?.[1], {
    rel: "alternate",
    type: "text/markdown",
    href: "https://www.remiforge.dev/test.md?lang=en",
  });
  // Site-wide discovery and identity links live on the root head; the leaf adds nothing site-wide
  assert.strictEqual(head.links?.length, 2);
  assert.notInclude(JSON.stringify(head.links), '"rel":"llms"');
  assert.notInclude(JSON.stringify(head.links), '"rel":"author"');
});

it("pageHead publishes exactly one JSON-LD block merging site entities with the page graph", () => {
  const head = pageHead({ social, markdownPath: "/test.md", graph });
  assert.strictEqual(head.scripts?.length, 1);
  const payload = JSON.parse(head.scripts?.[0]?.children ?? "{}");
  assert.strictEqual(payload["@context"], "https://schema.org");
  assert.isDefined(payload["@graph"].find((node: { "@type"?: string }) => node["@type"] === "WebSite"));
  assert.isDefined(payload["@graph"].find((node: { "@type"?: string }) => node["@type"] === "Person"));
  assert.isDefined(payload["@graph"].find((node: { "@type"?: string }) => node["@type"] === "WebPage"));
});

it("experienceHead builds on pageHead with article social type and canonical link", () => {
  const head = experienceHead({ experience: sampleExperience, preferredLanguage: language });
  const tags = metaOf(head);

  assert.strictEqual(tagContent(tags, "property", "og:type"), "article");
  assert.strictEqual(head.links?.find((link) => link.rel === "canonical")?.href, "https://www.remiforge.dev/sample-role");
  assert.strictEqual(tagContent(tags, "property", "og:url"), "https://www.remiforge.dev/sample-role");
  assert.strictEqual(head.scripts?.length, 1);
});

it("experienceHead names the experience kind as the article section", () => {
  // og:article:section is the one tag that tells a card reader which of the two kinds of page this
  // is, and it follows the experience type rather than a second table that has to agree with it.
  assert.strictEqual(
    tagContent(metaOf(experienceHead({ experience: sampleExperience, preferredLanguage: language })), "property", "article:section"),
    "portfolio"
  );
  assert.strictEqual(
    tagContent(metaOf(experienceHead({ experience: { ...sampleExperience, type: "e" }, preferredLanguage: language })), "property", "article:section"),
    "employment"
  );
});

it("experienceHead uses the global banner for Twitter when no screenshot exists", () => {
  const head = experienceHead({ experience: { ...sampleExperience, imageName: "" }, preferredLanguage: language });
  const tags = metaOf(head);

  assert.strictEqual(tagContent(tags, "name", "twitter:image"), GLOBAL_SOCIAL_IMAGE.src);
  assert.strictEqual(tagContent(tags, "property", "og:image"), GLOBAL_SOCIAL_IMAGE.src);
});

it("static page heads share the layout, each supplying its own canonical and Markdown twin", () => {
  const head = contactHead({ pageTitles: stablePageTitles, preferredLanguage: language });
  const tags = metaOf(head);

  assert.strictEqual(tagContent(tags, "name", "robots"), INDEXABLE_ROBOTS);
  assert.strictEqual(tagContent(tags, "property", "og:type"), "website");
  assert.strictEqual(head.links?.[0]?.href, "https://www.remiforge.dev/contact");
  assert.strictEqual(head.links?.[1]?.href, "https://www.remiforge.dev/contact.md?lang=en");
  assert.strictEqual(head.scripts?.length, 1);
});

it("experienceHead omits unsupported publication dates and keyword meta", () => {
  const head = experienceHead({ experience: sampleExperience, preferredLanguage: "en" });
  const dated = JSON.stringify(head.meta);
  // og:article:published_time is a meta tag the head would emit; the source data carries a year
  // only, so no guessed date is fabricated in meta tags
  assert.notInclude(dated, "article:published_time");
  assert.notInclude(dated, "datePublished");
  assert.notInclude(dated, '"name":"keywords"');
  assert.notInclude(dated, "article:tag");

  // The authored year is a display string ("Mar 2026", "2005 – 2007", "Too Long"), not an ISO
  // date, so it is never published as schema.org datePublished. It stays a factual "year" field in
  // the Markdown twin instead of a freshness claim the graph cannot substantiate.
  const graph = JSON.parse(head.scripts?.[0]?.children ?? "{}");
  assert.notInclude(JSON.stringify(graph), "datePublished");

  const undated = JSON.stringify(experienceHead({ experience: { ...sampleExperience, year: "Too Long" }, preferredLanguage: "en" }).meta);
  assert.notInclude(undated, "article:published_time");
  assert.notInclude(undated, "datePublished");
});

it("a detail page publishes the article card and its author, while the list pages stay website", () => {
  // The GEO guide's authoritative-attribution step: an experience detail page is document-like
  // — one authored subject with a headline and prose — so it publishes og:type "article" plus the
  // `article:author` a surface reading only og: tags can extract. The three list pages have no
  // claimed subject of their own and stay "website".
  const detail = JSON.stringify(experienceHead({ experience: sampleExperience, preferredLanguage: "en" }));
  assert.include(detail, '"property":"og:type","content":"article"');
  // A followable profile URL, not a display name: og:article:author is read as a link
  assert.include(detail, `"property":"article:author","content":"${AUTHOR_URL}"`);
  assert.notInclude(detail, `"property":"article:author","content":"${SITE_NAME}"`);

  const listPages = [
    homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }),
    educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en" }),
    contactHead({ pageTitles: stablePageTitles, preferredLanguage: "en" }),
  ];

  for (const head of listPages) {
    assert.include(JSON.stringify(head.meta), '"property":"og:type","content":"website"');
    assert.notInclude(JSON.stringify(head.meta), "article:author");
  }
});

it("every card image is addressable under both the bare and the structured og:image spelling", () => {
  // Facebook's crawler reads the og:image:* family as one record and og:image:url as its canonical
  // address. A card publishing only the bare og:image beside the family's other members leaves the
  // image ambiguous, so both spellings are published for the same src on every page kind.
  const metaOf = (head: ReturnType<typeof homeHead>) => JSON.parse(JSON.stringify(head.meta)) as ReadonlyArray<Record<string, string>>;
  const sourcesOf = (tags: ReadonlyArray<Record<string, string>>) => ({
    bare: tags.filter((tag) => tag["property"] === "og:image").map((tag) => tag["content"]),
    url: tags.filter((tag) => tag["property"] === "og:image:url").map((tag) => tag["content"]),
  });

  for (const head of [
    homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }),
    experienceHead({ experience: sampleExperience, preferredLanguage: "en" }),
    // A screenshot-less experience falls back to the banner on both cards, so the banner is the
    // published address either way
    experienceHead({ experience: { ...sampleExperience, imageName: "" }, preferredLanguage: "pl" }),
  ]) {
    const { bare, url } = sourcesOf(metaOf(head));
    assert.deepStrictEqual(url, bare);
    // Declared absolute, so a scraper never has to resolve an origin
    assert.isTrue(bare.every((src) => (src ?? "").startsWith("https://")));
  }
});

it("each card's alt describes the picture that card actually shows", () => {
  // og:image and twitter:image publish different pictures — X rejects WebP, so the Twitter card
  // falls back to the jpeg banner — and a card whose alt describes the other card's picture
  // announces an image it is not showing. Read the alt back beside the image each card names.
  const contentOf = (head: ReturnType<typeof experienceHead>, tag: "og:image:alt" | "twitter:image:alt") => {
    const meta = JSON.parse(JSON.stringify(head.meta)) as Array<Record<string, string>>;
    return meta.find((entry) => entry[tag.startsWith("og:") ? "property" : "name"] === tag)?.content;
  };

  const srcOf = (target: ReturnType<typeof experienceHead>, tag: "og:image" | "twitter:image") => {
    const meta = JSON.parse(JSON.stringify(target.meta)) as Array<Record<string, string>>;
    return meta.find((entry) => entry[tag.startsWith("og:") ? "property" : "name"] === tag)?.content;
  };

  const head = experienceHead({ experience: sampleExperience, preferredLanguage: "en" });
  // og:image is the webp screenshot, so its alt names that screenshot
  assert.include(srcOf(head, "og:image") ?? "", "01-a.webp");
  assert.strictEqual(contentOf(head, "og:image:alt"), "Screenshot of Full-Stack Developer");
  // twitter:image is the banner, so its alt names the banner
  assert.strictEqual(srcOf(head, "twitter:image"), "https://www.remiforge.dev/opengraph-image.jpg");
  assert.strictEqual(contentOf(head, "twitter:image:alt"), "Portfolio collage showing web development skills and project screenshots");

  // A screenshot-less experience falls back to the banner on both cards, so both alts describe it
  const bare = experienceHead({ experience: { ...sampleExperience, imageName: "" }, preferredLanguage: "en" });
  assert.include(srcOf(bare, "og:image") ?? "", "opengraph-image.jpg");
  assert.strictEqual(contentOf(bare, "og:image:alt"), "Portfolio collage showing web development skills and project screenshots");

  const polish = experienceHead({ experience: sampleExperience, preferredLanguage: "pl" });
  assert.strictEqual(contentOf(polish, "og:image:alt"), "Zrzut ekranu przedstawiający Projekt osobisty: Full-Stack Developer");
  assert.strictEqual(contentOf(polish, "twitter:image:alt"), "Kolaż portfolio przedstawiający umiejętności tworzenia stron i zrzuty projektów");

  // A screen-reader user hears a sentence, not a bare repeat of the title the card already shows
  assert.include(contentOf(head, "og:image:alt") ?? "", "Full-Stack Developer");
  assert.notStrictEqual(contentOf(head, "og:image:alt"), "Full-Stack Developer");
});

it("social tags share the verified share image and localized locale pair", () => {
  const pl = experienceHead({ experience: sampleExperience, preferredLanguage: "pl" });
  const html = JSON.stringify(pl);
  assert.include(html, '"content":"pl_PL"');
  assert.include(html, '"content":"en_US"'); // alternate
  // A detail page is article-like: one authored subject with a headline and prose, so it publishes
  // the article card rather than the generic website type the three list pages carry
  assert.include(html, '"property":"og:type","content":"article"');
  assert.include(html, `"property":"og:url","content":"https://www.remiforge.dev/sample-role"`);
  // og:image carries the webp screenshot with real dimensions; X/Twitter falls back to the global jpeg
  assert.include(html, '"property":"og:image:type","content":"image/webp"');
  assert.include(html, '"property":"og:image:width","content":"1600"');
  assert.include(html, '"property":"og:image:height","content":"900"');
  assert.include(html, '"name":"twitter:image","content":"https://www.remiforge.dev/opengraph-image.jpg"');
  assert.include(html, '"name":"twitter:card","content":"summary_large_image"');
  // og:title carries the bare headline; the document <title> keeps the site prefix
  assert.include(html, '"title":"Remi Forge ● Projekt osobisty: Full-Stack Developer"');
  assert.include(html, '"property":"og:title","content":"Projekt osobisty: Full-Stack Developer"');
});

it("og:locale:alternate lists every other supported locale as its own tag (ogp.me array)", () => {
  // og:locale:alternate is an array, not a single value: one meta tag per alternate locale, and a
  // page never lists the locale it is itself in. Read the rendered tags back rather than the raw
  // JSON so a regression to a single first-match (or a self-including alternate) fails here.
  const localesOf = (preferredLanguage: "en" | "pl") => {
    const meta = JSON.parse(JSON.stringify(experienceHead({ experience: sampleExperience, preferredLanguage }).meta)) as Array<Record<string, string>>;
    return {
      own: meta.filter((tag) => tag["property"] === "og:locale").map((tag) => tag["content"]),
      alternate: meta.filter((tag) => tag["property"] === "og:locale:alternate").map((tag) => tag["content"]),
    };
  };

  // Every supported locale except the page's own; the page's own locale appears only under og:locale
  assert.deepStrictEqual(localesOf("en"), { own: ["en_US"], alternate: ["pl_PL"] });
  assert.deepStrictEqual(localesOf("pl"), { own: ["pl_PL"], alternate: ["en_US"] });
});

it("localized metadata uses authored SEO copy and emits canonical plus Markdown links", () => {
  assert.deepStrictEqual(canonicalLink("https://www.remiforge.dev/education"), { rel: "canonical", href: "https://www.remiforge.dev/education" });

  const head = homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "pl" });
  const html = JSON.stringify(head);
  assert.include(html, "Stable home title");
  assert.include(html, STATIC_PAGES["/"].copy.pl.description);
  assert.include(html, `Remi Forge ● ${STATIC_PAGES["/"].copy.pl.title}`);
  assert.include(html, '"content":"pl_PL"');
  assert.include(html, "https://www.remiforge.dev/index.md");
  // The HTML pages are language-negotiated from one URL, so hreflang alternates must not claim
  // distinct documents; a leaf page advertises only its canonical and the Markdown twin — the
  // site-wide discovery and identity links are the root head's concern.
  assert.notInclude(html, "hrefLang");
  assert.deepStrictEqual(
    head.links?.map(({ rel }) => rel),
    ["canonical", "alternate"]
  );
  assert.strictEqual(head.links?.[0]?.href, "https://www.remiforge.dev/");
  // The Polish page advertises the Polish twin, not a negotiated variant
  assert.strictEqual(head.links?.[1]?.href, "https://www.remiforge.dev/index.md?lang=pl");
});

it("og:url is byte-equal to the canonical link on every page kind", () => {
  // The builder resolves the canonical once and both surfaces publish that same string. Running the
  // URL math twice — once for the <link> and again for og:url — is how two spellings of one
  // document drift apart, which hands crawlers a duplicate-URL signal it has to reconcile.
  const ogUrlOf = (head: ReturnType<typeof homeHead>) => {
    const meta = JSON.parse(JSON.stringify(head.meta)) as Array<Record<string, string>>;
    return meta.find((tag) => tag["property"] === "og:url")?.content;
  };
  const canonicalOf = (head: ReturnType<typeof homeHead>) => head.links?.find((tag) => tag.rel === "canonical")?.href;

  for (const head of [
    homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }),
    educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "pl" }),
    contactHead({ pageTitles: stablePageTitles, preferredLanguage: "en" }),
    experienceHead({ experience: { ...sampleExperience, slug: "résumé & more" }, preferredLanguage: "pl" }),
  ]) {
    assert.strictEqual(ogUrlOf(head), canonicalOf(head));
    // Both are absolute, so a scraper never has to resolve an origin
    assert.isTrue((ogUrlOf(head) ?? "").startsWith("https://"));
  }
});

it("language-pinned Markdown URLs attach ?lang= and survive values the URL parser rejects", () => {
  assert.strictEqual(withLanguageParam("https://www.remiforge.dev/index.md", "pl"), "https://www.remiforge.dev/index.md?lang=pl");
  assert.strictEqual(withLanguageParam("https://www.remiforge.dev/index.md", "en"), "https://www.remiforge.dev/index.md?lang=en");
  // An existing variant is replaced rather than duplicated, so each language still pins the document
  assert.strictEqual(withLanguageParam("https://www.remiforge.dev/index.md?lang=en", "pl"), "https://www.remiforge.dev/index.md?lang=pl");
  // A relative path is a bad canonical, not a crash: it is passed through untouched
  assert.strictEqual(withLanguageParam("/index.md", "pl"), "/index.md");
  assert.strictEqual(withLanguageParam("not a url", "pl"), "not a url");
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
  assert.deepStrictEqual(nodeOf(parsed, "Person")?.worksFor, { "@id": "https://www.remiforge.dev/sample-job#organization" });
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

it("education structured data links its page to the Person and the Person to attended schools", () => {
  const head = educationHead({ pageTitles: stablePageTitles, educationList: sampleEducation, preferredLanguage: "en" });
  const graph = graphOf(head.scripts?.[0]?.children);
  // The page is about the Person. Schools are organizations, not CreativeWorks, so they do not go in Collection.hasPart.
  const collection = nodeOf(graph, "CollectionPage");
  assert.deepStrictEqual(collection?.isPartOf, { "@id": "https://www.remiforge.dev/#website" });
  assert.deepStrictEqual(collection?.breadcrumb, { "@id": "https://www.remiforge.dev/education#breadcrumb" });
  assert.deepStrictEqual(collection?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
  assert.isUndefined(nodeOf(graph, "Collection"));
  const school = nodeOf(graph, "EducationalOrganization");
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
  // The site Person is still present, but carries no alumni edge — an empty list adds no "studied at"
  assert.isDefined(nodeOf(empty, "Person"));
  assert.isUndefined(nodeOf(empty, "Person")?.alumniOf);
  assert.deepStrictEqual(nodeOf(empty, "CollectionPage")?.mainEntity, { "@id": "https://www.remiforge.dev/#person" });
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

// Helpers used by the JSON-LD graph tests above
const collectionParts = (node: Record<string, unknown> | undefined) =>
  pipe(
    Option.fromNullishOr(node),
    Option.flatMap((value) => Schema.decodeUnknownOption(Schema.Array(JsonLdNode))(value["hasPart"])),
    Option.getOrElse<ReadonlyArray<Record<string, unknown>>>(() => [])
  );

const listItems = (node: Record<string, unknown> | undefined) =>
  pipe(
    Option.fromNullishOr(node),
    Option.flatMap((value) => Schema.decodeUnknownOption(Schema.Array(JsonLdNode))(value["itemListElement"])),
    Option.getOrElse<ReadonlyArray<Record<string, unknown>>>(() => [])
  );

import { assert, it } from "@effect/vitest";
import { contactHead, educationHead, experienceHead, homeHead } from "../page-head";
import { rootHead, ROOT_HEAD } from "../root-head";
import { fallbackHead } from "../helpers";
import { headLanguage, routeHead } from "../route-head";
import { canonicalLink } from "../helpers";
import { withLanguageParam } from "../urls";
import { STATIC_PAGES } from "../pages";
import { PERSON_DESCRIPTION, SITE_DESCRIPTION, SITE_NAME, AUTHOR_URL } from "../constants";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import type { PageTitles } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { MetaTag, PageHead } from "../models";

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

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
};

// The loader payload shapes headLanguage sees: a valid locale, an unsupported
// one, and a missing match entry (404 / SSR shell renders before the root loader resolves)
const rootLoaderData = [{ loaderData: { preferredLanguage: "pl" } }, { loaderData: { preferredLanguage: "de" } }] as const;

// TanStack keeps the last meta tag for each name/property (and the single <title>), so replay
// that merge to assert which value a browser actually receives from the root fallback chain.
const dedupeMeta = (tags: ReadonlyArray<MetaTag>): ReadonlyArray<MetaTag> => {
  const keyOf = (tag: MetaTag) => ("title" in tag ? "title" : "name" in tag ? `name:${tag.name}` : "property" in tag ? `property:${tag.property}` : "charset");

  const merged = new Map<string, MetaTag>();
  for (const tag of tags) merged.set(keyOf(tag), tag);
  return [...merged.values()];
};

it("root metadata defaults to noindex and complete page heads explicitly allow indexing", () => {
  assert.include(JSON.stringify(ROOT_HEAD.meta), `"content":"${NOINDEX_FOLLOW}"`);
  // iOS and high-DPI search previews resolve the touch icon site-wide, alongside the SVG favicon
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"apple-touch-icon"');
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/avatar.jpg");
  // rel="me" identity links mirror the JSON-LD sameAs profiles for verifiers
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"me"');
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://github.com/remi-k-work");
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://linkedin.com/in/remi-k-work");
  // Site-wide machine-readable discovery: every HTML page advertises the AI indexes
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/llms.txt");
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/llms-full.txt");
  // llms.txt auto-discovery link relation
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"llms"');
  // Author attribution as a followable link
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"author"');
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/");
  // The sitemap is declared in-document, not only from robots.txt, so a crawler that lands on a
  // page finds the URL list without fetching the crawl directives first
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"sitemap"');
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/sitemap.xml");
  // An unmatched URL falls back to this head, and TanStack dedupes `meta` by name/property keeping
  // the leaf's value — so a root-level og:url would survive on exactly the pages that have no head
  // of their own and advertise the homepage as their canonical og:URL
  assert.notInclude(JSON.stringify(ROOT_HEAD.meta), '"property":"og:url"');
  assert.notInclude(JSON.stringify(ROOT_HEAD.meta), '"name":"twitter:card"');
  // TanStack dedupes link tags only when byte-identical, so a root-level twin alternate would
  // render beside every page's own — advertising the English home twin from a Polish subpage
  assert.notInclude(JSON.stringify(ROOT_HEAD.links), '"type":"text/markdown"');

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

it("root metadata carries the authored site description on every surface", () => {
  assert.include(JSON.stringify(ROOT_HEAD.meta), SITE_DESCRIPTION);
  // The same bio feeds the Person node (see structured-data.test.ts): one fact, many surfaces
  assert.strictEqual(PERSON_DESCRIPTION.length > 0, true);
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

  const head = experienceHead({ experience: sampleExperience, preferredLanguage: "en" });
  const srcOf = (target: ReturnType<typeof experienceHead>, tag: "og:image" | "twitter:image") => {
    const meta = JSON.parse(JSON.stringify(target.meta)) as Array<Record<string, string>>;
    return meta.find((entry) => entry[tag.startsWith("og:") ? "property" : "name"] === tag)?.content;
  };

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

it("the root head publishes the site-wide discovery and author links exactly once", () => {
  // rel="llms" lets AI crawlers find the index from HTTP headers alone (https://llmstxt.com).
  // The root declares it once for the whole site; a leaf page that restated it would only emit a
  // byte-identical duplicate the router then has to dedupe.
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"llms"');
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/llms.txt");
  // rel="author" gives parsers that don't read OpenGraph a followable profile URL (GEO attribution)
  assert.include(JSON.stringify(ROOT_HEAD.links), '"rel":"author"');
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/");

  // Pages contribute only their own canonical and Markdown alternate; nothing site-wide is repeated
  for (const head of [
    homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }),
    experienceHead({ experience: sampleExperience, preferredLanguage: "en" }),
  ]) {
    assert.notInclude(JSON.stringify(head.links), '"rel":"llms"');
    assert.notInclude(JSON.stringify(head.links), '"rel":"author"');
  }
});

it("experience URL construction percent-encodes one slug consistently in canonical, social, alternate and JSON-LD URLs", () => {
  const slug = "résumé & more";
  const encodedPath = "/r%C3%A9sum%C3%A9%20%26%20more";
  const head = experienceHead({ experience: { ...sampleExperience, slug }, preferredLanguage: "en" });
  const html = JSON.stringify(head);

  assert.strictEqual(head.links?.[0]?.href, `https://www.remiforge.dev${encodedPath}`);
  // The alternate twin is pinned to the page's language, matching what the twin Link header serves
  assert.strictEqual(head.links?.[1]?.href, `https://www.remiforge.dev${encodedPath}.md?lang=en`);
  assert.include(html, `"property":"og:url","content":"https://www.remiforge.dev${encodedPath}"`);
});

it("experience URLs percent-encode parentheses so the path survives as a Markdown destination", () => {
  const head = experienceHead({ experience: { ...sampleExperience, slug: "role (senior)" }, preferredLanguage: "en" });

  assert.strictEqual(head.links?.[0]?.href, "https://www.remiforge.dev/role%20%28senior%29");
  assert.strictEqual(head.links?.[1]?.href, "https://www.remiforge.dev/role%20%28senior%29.md?lang=en");
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

it("routeHead keeps a canonical noindex fallback when loader data is missing", () => {
  const fallback = routeHead({
    loaderData: undefined,
    matches: [],
    matchStatus: "success",
    fallbackPath: "/contact",
    build: () => homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }),
  });

  assert.deepStrictEqual(
    fallback.links?.map(({ rel, href }) => ({ rel, href })),
    [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]
  );
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Page unavailable"');
  assert.include(JSON.stringify(fallback.meta), "This page is temporarily unavailable.");
  // The fallback still publishes the site entities, just not the page's own graph.
  assert.isAbove(JSON.parse(fallback.scripts?.[0]?.children ?? "{}")["@graph"].length, 0);
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

it("rootHead adds localized not-found metadata while retaining site-wide discovery links", () => {
  const fallback = rootHead([{ loaderData: { preferredLanguage: "pl" }, status: "success" }, { status: "notFound" }]);

  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Nie znaleziono"');
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.include(JSON.stringify(fallback.links), '"rel":"llms"');
  assert.include(JSON.stringify(fallback.links), '"rel":"sitemap"');
  assert.notInclude(JSON.stringify(fallback.links), '"rel":"canonical"');
  assert.strictEqual(fallback.scripts?.length, 1);
});

it("the not-found fallback wins the root's duplicate meta tags after TanStack's merge", () => {
  const head = rootHead([{ loaderData: { preferredLanguage: "pl" }, status: "success" }, { status: "notFound" }]);
  const rendered = JSON.stringify(dedupeMeta(head.meta));

  // One title, description and robots directive, each carrying the not-found value rather than
  // the root's default description and home title
  assert.include(rendered, '"title":"Remi Forge ● Nie znaleziono"');
  assert.include(rendered, "Nie znaleziono żądanej strony.");
  assert.include(rendered, NOINDEX_FOLLOW);
  assert.notInclude(rendered, SITE_DESCRIPTION);
  assert.strictEqual((rendered.match(/"title":/g) ?? []).length, 1);
  assert.strictEqual((rendered.match(/"name":"description"/g) ?? []).length, 1);
  assert.strictEqual((rendered.match(/"name":"robots"/g) ?? []).length, 1);
});

it("rootHead serves the site-wide head with no scripts when no match is a not-found", () => {
  // The branch every successful SSR page takes: the root contributes its identity and discovery
  // links but no fallback document and, critically, no JSON-LD. TanStack concatenates every
  // match's scripts, so a root-level graph would render beside the page's own single block.
  const head = rootHead([{ loaderData: { preferredLanguage: "en" }, status: "success" }, { status: "success" }]);

  assert.deepStrictEqual(head.scripts, []);
  // No unavailable/not-found fallback copy is merged into a successful page's head
  assert.notInclude(JSON.stringify(head.meta), "Page unavailable");
  assert.notInclude(JSON.stringify(head.meta), "Not Found");
  // The site-wide identity and discovery links ride along unchanged
  assert.include(JSON.stringify(head.links), '"rel":"llms"');
  assert.include(JSON.stringify(head.links), '"rel":"sitemap"');
  assert.include(JSON.stringify(head.links), '"rel":"me"');
  assert.include(JSON.stringify(head.links), '"rel":"author"');
  // The root's noindex default survives on the happy path too: a leaf head always overrides it
  // by name, while a page that declares no head of its own keeps the safe fallback
  assert.include(JSON.stringify(head.meta), NOINDEX_FOLLOW);
});

it("rootHead recognizes TanStack's internal not-found marker", () => {
  const fallback = rootHead([{ loaderData: { preferredLanguage: "pl" }, status: "success" }, { _notFound: true }]);

  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Nie znaleziono"');
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.notInclude(JSON.stringify(fallback.links), '"rel":"canonical"');
});

it("rootHead hands every document its own head arrays rather than sharing the site-wide ones", () => {
  // The root head is one declaration rendered into every document on the site. Sharing its arrays
  // would mean one caller's head reaching into another page's meta and links through the same
  // reference, which is exactly the mutation the PageHead contract rules out (see domain/models).
  const matches = [{ loaderData: { preferredLanguage: "en" }, status: "success" }] as const;
  const first = rootHead(matches);
  const second = rootHead(matches);

  assert.notStrictEqual(first.meta, ROOT_HEAD.meta);
  assert.notStrictEqual(first.links, ROOT_HEAD.links);
  assert.notStrictEqual(first.meta, second.meta);
  assert.notStrictEqual(first.links, second.links);
  // The shared declaration itself is still intact, and the copies carry the same values
  assert.deepStrictEqual(first.meta, [...ROOT_HEAD.meta]);
  assert.deepStrictEqual(first.links, [...ROOT_HEAD.links]);
  assert.deepStrictEqual(first.meta, second.meta);

  // The not-found branch merges the fallback into fresh arrays too
  const notFound = rootHead([{ loaderData: { preferredLanguage: "en" }, status: "success" }, { status: "notFound" }]);
  assert.notStrictEqual(notFound.meta, ROOT_HEAD.meta);
  assert.notStrictEqual(notFound.links, ROOT_HEAD.links);
});

it("routeHead leaves not-found metadata to the root boundary, even with stale loader data", () => {
  let builderCalled = false;
  const build = () => {
    builderCalled = true;
    return homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" });
  };

  const notFound = routeHead({
    loaderData: { title: "Stale page data" },
    matches: [{ loaderData: { preferredLanguage: "pl" }, status: "error", _notFound: true }],
    matchStatus: "error",
    fallbackPath: "/missing",
    build,
  });
  const rootFallback = rootHead([{ loaderData: { preferredLanguage: "pl" }, status: "success" }, { status: "notFound" }]);

  assert.deepStrictEqual(notFound, { meta: [], links: [], scripts: [] });
  assert.isFalse(builderCalled);
  assert.include(JSON.stringify(rootFallback.meta), '"title":"Remi Forge ● Nie znaleziono"');
  assert.include(JSON.stringify(rootFallback.meta), "Nie znaleziono żądanej strony.");
  assert.include(JSON.stringify(rootFallback.meta), NOINDEX_FOLLOW);
});

it("routeHead uses a noindex unavailable head instead of stale loader data after an error", () => {
  let builderCalled = false;
  const fallback = routeHead({
    loaderData: { title: "Stale page data" },
    matches: [{ loaderData: { preferredLanguage: "pl" }, status: "error" }],
    matchStatus: "error",
    fallbackPath: "/missing",
    build: () => {
      builderCalled = true;
      return pageHeadFromInput("Stale page data", "pl");
    },
  });

  assert.isFalse(builderCalled);
  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Strona niedostępna"');
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.deepStrictEqual(fallback.links, [{ rel: "canonical", href: "https://www.remiforge.dev/missing" }]);
});

it("routeHead ignores stale loader data while the current match is pending", () => {
  let builderCalled = false;
  const fallback = routeHead({
    loaderData: { title: "Previous route data" },
    matches: [
      { loaderData: { preferredLanguage: "pl" }, status: "success" },
      { loaderData: { title: "Previous route data" }, status: "pending" },
    ],
    matchStatus: "pending",
    fallbackPath: "/contact",
    build: () => {
      builderCalled = true;
      return pageHeadFromInput("Previous route data", "pl");
    },
  });

  assert.isFalse(builderCalled);
  assert.include(JSON.stringify(fallback.meta), '"title":"Remi Forge ● Strona niedostępna"');
  assert.include(JSON.stringify(fallback.meta), NOINDEX_FOLLOW);
  assert.deepStrictEqual(fallback.links, [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]);
  assert.strictEqual(fallback.scripts?.length, 1);
});

it("routeHead delegates to the builder when loader data is present, resolving language from matches", () => {
  const build = (loaderData: { readonly title: string }, preferredLanguage: "en" | "pl") => pageHeadFromInput(loaderData.title, preferredLanguage);
  const matches = [{ loaderData: { preferredLanguage: "pl" } }];

  const head = routeHead({ loaderData: { title: "Custom" }, matches, matchStatus: "success", fallbackPath: "/contact", build });

  // The builder received the loader data and the resolved language
  assert.include(JSON.stringify(head.meta), '"title":"Remi Forge ● Custom"');
  assert.include(JSON.stringify(head.meta), '"content":"pl_PL"');
});

// Minimal inline pageHead substitute for the routeHead delegation test — keeps the test
// self-contained without importing the full page-head module.
const pageHeadFromInput = (title: string, preferredLanguage: "en" | "pl"): PageHead => ({
  meta: [
    { title: `Remi Forge ● ${title}` },
    { name: "robots", content: INDEXABLE_ROBOTS },
    { property: "og:locale", content: preferredLanguage === "pl" ? "pl_PL" : "en_US" },
  ],
  links: [{ rel: "canonical", href: "https://www.remiforge.dev/" }],
  scripts: [],
});

it("headLanguage resolves the root loader locale and falls back safely", () => {
  assert.strictEqual(headLanguage(rootLoaderData), "pl");
  // An unsupported locale and a missing match entry (404 / SSR shell renders before the root loader
  // resolves) are two different causes with one answer: the site default
  assert.strictEqual(headLanguage([{ loaderData: { preferredLanguage: "de" } }]), "en");
  assert.strictEqual(headLanguage([]), "en");
  // A malformed payload degrades to the default language instead of throwing inside head()
  assert.strictEqual(headLanguage([{ loaderData: null }]), "en");
});

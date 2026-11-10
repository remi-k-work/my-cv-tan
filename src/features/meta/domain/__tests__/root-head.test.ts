import { assert, it } from "@effect/vitest";
import { ROOT_HEAD } from "../root-head";
import { rootHead } from "../root-head";
import { homeHead, contactHead, educationHead, experienceHead } from "../page-head";
import { AI_INDEX_LINKS, AI_INDEX_LINK_HEADER } from "../discovery";
import { joinLinkHeader } from "../link-tags";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import type { PageTitles } from "@/domain/models";
import type { MetaTag } from "../models";

// Dedupe meta tags by name/property, keeping the last occurrence (mirrors TanStack's merge).
const dedupeMeta = (tags: ReadonlyArray<MetaTag>): ReadonlyArray<MetaTag> => {
  const keyOf = (tag: MetaTag) => ("title" in tag ? "title" : "name" in tag ? `name:${tag.name}` : "property" in tag ? `property:${tag.property}` : "charset");
  const merged = new Map<string, MetaTag>();
  for (const tag of tags) merged.set(keyOf(tag), tag);
  return [...merged.values()];
};

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home description." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education description." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact description." },
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
  assert.include(JSON.stringify(ROOT_HEAD.meta), "Remi Forge is a web developer in Rzeszów, Poland");
  // The same bio feeds the Person node (see helpers.test.ts): one fact, many surfaces
  assert.strictEqual("Passionate, self-taught web developer".length > 0, true);
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
    experienceHead({
      experience: {
        type: "p",
        slug: "sample-role",
        year: "Mar 2026",
        role: "Full-Stack Developer",
        company: "Sample Co",
        txt: "Built things with care.",
        gitHubLink: "https://github.com/example/repo",
        imageName: "01",
        skillsUsed: ["TypeScript", "React"],
      },
      preferredLanguage: "en",
    }),
  ]) {
    assert.notInclude(JSON.stringify(head.links), '"rel":"llms"');
    assert.notInclude(JSON.stringify(head.links), '"rel":"author"');
  }
});

it("root head carries no JSON-LD, so a page's single block is not duplicated", () => {
  // TanStack concatenates the scripts of every match in the chain rather than replacing them, so a
  // root-level graph would render beside a page's own. Asserting the root declares none is what
  // keeps the "exactly one block per page" invariant below from silently regressing (the compile
  // guard for it lives on the RootHead type in root-head.ts).
  assert.notInclude(JSON.stringify(ROOT_HEAD), "ld+json");
  // The root still declares the site-wide facts every page shares: icons, identity links, and the
  // AI discovery documents an unmatched route needs to point AI fetchers at the document graph
  assert.include(JSON.stringify(ROOT_HEAD.links), "https://www.remiforge.dev/llms.txt");
});

it("the AI indexes project into both the <head> advertisements and the Link header from one record", () => {
  // Same documents, both surfaces: a crawler that only parses response headers sees exactly what a
  // crawler that only parses the <head> sees.
  assert.deepStrictEqual(AI_INDEX_LINKS, [
    { rel: "alternate", type: "text/plain", title: "llms.txt", href: "https://www.remiforge.dev/llms.txt" },
    { rel: "alternate", type: "text/plain", title: "llms-full.txt", href: "https://www.remiforge.dev/llms-full.txt" },
  ]);

  assert.strictEqual(
    AI_INDEX_LINK_HEADER,
    '<https://www.remiforge.dev/llms.txt>; rel="alternate"; type="text/plain"; title="llms.txt", <https://www.remiforge.dev/llms-full.txt>; rel="alternate"; type="text/plain"; title="llms-full.txt"'
  );
  // The joined constant is the joined list, not a second spelling of it
  assert.strictEqual(AI_INDEX_LINK_HEADER, joinLinkHeader(AI_INDEX_LINKS));

  // The site-wide head carries the <link> projection, so the HTML document advertises the indexes too
  assert.deepStrictEqual(
    ROOT_HEAD.links.filter(({ rel }) => rel === "alternate"),
    [...AI_INDEX_LINKS]
  );
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
  // the root's own defaults
  assert.include(rendered, '"title":"Remi Forge ● Nie znaleziono"');
  assert.include(rendered, "Nie znaleziono żądanej strony.");
  assert.include(rendered, NOINDEX_FOLLOW);
  assert.notInclude(rendered, "Remi Forge is a web developer in Rzeszów, Poland");
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
  // reference, which is exactly the mutation the PageHead contract rules out.
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

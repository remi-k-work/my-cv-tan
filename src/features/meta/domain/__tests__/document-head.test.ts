// The document a browser actually receives, rather than any single head result: the root route's
// head and a leaf route's head are two results the router merges into one, so the invariants the
// head modules only assert in comments — one title, one description, one robots directive, one
// canonical link, one JSON-LD block, and the site-wide discovery links declared exactly once — are
// properties of that merged document. These replay the router's own merge to pin them.

import { assert, it } from "@effect/vitest";
import { GTProvider, initializeGT } from "gt-tanstack-start";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import gtConfig from "../../../../../gt.config.json";
import { loadTranslations } from "@/lib/gt-translations";
import { contactHead, educationHead, experienceHead, homeHead } from "../page-head";
import { rootHead } from "../root-head";
import { routeHead } from "../route-head";
import { INDEXABLE_ROBOTS, NOINDEX_FOLLOW } from "@/domain/http";
import { NotFoundPage } from "@/ui/not-found-page";
import { BRANDED_TITLE, NOT_FOUND_COPY, SITE_DESCRIPTION, SOCIAL_LINKS, UNAVAILABLE_COPY } from "../site";
import { fallbackHead } from "../fallback";
import type { PageTitles } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";
import type { LinkTag, MatchChain, MetaTag, PageHead } from "../models";

// The not-found page reads the request locale through GT, so the runtime has to be initialized
// before it renders — exactly as the twin-localization tests do for the same reason.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

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

// The router's head merge (headContentUtils in @tanstack/react-router), replayed so the assertions
// below read the merged document: matches are walked leaf-last, the first tag seen for each
// name/property wins, and links and scripts are concatenated with byte-identical duplicates
// dropped. The `charSet` tag carries neither attribute, so the router never dedupes it either — the
// root declares the only one on the site.
interface MergedHead {
  readonly title: string | undefined;
  readonly tagsOf: (key: "name" | "property", value: string) => string | undefined;
  readonly links: ReadonlyArray<LinkTag>;
  readonly scripts: ReadonlyArray<string>;
}

const mergeHeads = (heads: ReadonlyArray<PageHead>): MergedHead => {
  const metaByKey = new Map<string, MetaTag>();
  let title: string | undefined;

  for (const head of [...heads].reverse()) {
    for (const tag of [...head.meta].reverse()) {
      if ("title" in tag) {
        title ??= tag.title;
        continue;
      }
      if ("name" in tag) {
        if (!metaByKey.has(`name:${tag.name}`)) metaByKey.set(`name:${tag.name}`, tag);
      } else if ("property" in tag) {
        if (!metaByKey.has(`property:${tag.property}`)) metaByKey.set(`property:${tag.property}`, tag);
      } else metaByKey.set("charset", tag);
    }
  }

  return {
    title,
    tagsOf: (key, value) => {
      const tag = metaByKey.get(`${key}:${value}`);
      return tag !== undefined && "content" in tag ? tag.content : undefined;
    },
    links: [...new Set(heads.flatMap((head) => head.links.map((link) => JSON.stringify(link))))].map((link) => JSON.parse(link) as LinkTag),
    scripts: [...new Set(heads.flatMap((head) => head.scripts.map((script) => script.children)))],
  };
};

const relsOf = (links: ReadonlyArray<LinkTag>, rel: string) => links.filter((link) => link.rel === rel);

// The match chain a hydrated document carries: a resolved root loader, then the page's own match.
const successMatches: MatchChain = [{ loaderData: { preferredLanguage: "pl" }, status: "success" }, { status: "success" }];

// Every page kind's own head, built the way its route builds it.
const pageHeads: ReadonlyArray<PageHead> = [
  homeHead({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "pl" }),
  contactHead({ pageTitles: stablePageTitles, preferredLanguage: "en" }),
  educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en" }),
  experienceHead({ experience: sampleExperience, preferredLanguage: "en" }),
];

it("a successful page's merged document declares its own title, description, robots and canonical exactly once", () => {
  for (const head of pageHeads) {
    const document = mergeHeads([rootHead(successMatches), head]);

    // The leaf's own values win the router's per-attribute merge, so the root's site defaults never
    // reach a page that declares its own: the title, description and robots directive a browser
    // reads are the page's, and the root's noindex default survives nowhere on it.
    const description = head.meta.find((tag) => "name" in tag && tag.name === "description");
    assert.strictEqual(document.title, head.meta.find((tag) => "title" in tag)?.title);
    assert.strictEqual(document.tagsOf("name", "description"), description !== undefined && "content" in description ? description.content : undefined);
    assert.strictEqual(document.tagsOf("name", "robots"), INDEXABLE_ROBOTS);

    // One canonical, one Markdown alternate beside the root's two AI indexes, one JSON-LD block
    assert.strictEqual(relsOf(document.links, "canonical").length, 1);
    assert.strictEqual(relsOf(document.links, "alternate").length, 3);
    assert.strictEqual(document.scripts.length, 1);
    // The page's canonical and its og:url are one address in the merged document too
    assert.strictEqual(document.tagsOf("property", "og:url"), relsOf(document.links, "canonical")[0]?.href);
  }
});

it("the site-wide discovery and identity links are declared once per document and never by a leaf", () => {
  // rel="me", rel="author", rel="llms" and rel="sitemap" are the root's: a leaf that restated one
  // would emit a duplicate the router only drops when byte-identical, and two <link> elements for
  // one relation is a contradiction a verifier has to reconcile. `me` is the one relation published
  // once per social profile, so its count is the profile count.
  for (const head of pageHeads) {
    const document = mergeHeads([rootHead(successMatches), head]);

    assert.strictEqual(relsOf(document.links, "me").length, SOCIAL_LINKS.length);
    for (const rel of ["author", "llms", "sitemap"]) {
      assert.strictEqual(relsOf(document.links, rel).length, 1, `${rel} must be declared once per document`);
    }
    // No relation and destination pair is emitted twice, whatever rel it is
    assert.strictEqual(new Set(document.links.map((link) => `${link.rel}:${link.href}`)).size, document.links.length);
    for (const rel of ["me", "author", "llms", "sitemap"]) {
      assert.deepStrictEqual(relsOf(head.links, rel), [], `a leaf must not declare ${rel}`);
    }
  }
});

it("a not-found document carries the root's fallback copy and no canonical, while the page's own head stays silent", () => {
  // The root boundary owns not-found metadata: the leaf route returns nothing so a stale loader
  // payload cannot publish the previous page's canonical or graph over the failure.
  const notFoundMatches: MatchChain = [{ loaderData: { preferredLanguage: "pl" }, status: "success" }, { status: "notFound" }];
  const leaf = routeHead({
    loaderData: { stale: "data" },
    matches: notFoundMatches,
    matchStatus: "notFound",
    fallbackPath: "/missing",
    build: () => homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }),
  });

  const document = mergeHeads([rootHead(notFoundMatches), leaf]);

  assert.deepStrictEqual(leaf, { meta: [], links: [], scripts: [] });
  assert.strictEqual(document.title, BRANDED_TITLE(NOT_FOUND_COPY.pl.title));
  assert.strictEqual(document.tagsOf("name", "description"), NOT_FOUND_COPY.pl.description);
  assert.strictEqual(document.tagsOf("name", "robots"), NOINDEX_FOLLOW);
  // The fallback's copy wins the merge against the root's own defaults, which is what a browser reads
  assert.notStrictEqual(document.tagsOf("name", "description"), SITE_DESCRIPTION);
  assert.deepStrictEqual(relsOf(document.links, "canonical"), []);
  // The site-wide discovery links survive a not-found document, and it still publishes the entities
  assert.strictEqual(relsOf(document.links, "llms").length, 1);
  assert.strictEqual(document.scripts.length, 1);
});

it("a page whose data is unavailable publishes its own fallback beside the site-wide head", () => {
  // A failed revalidation leaves loaderData populated, so the route's own head is the only thing
  // standing between a stale page's graph and a noindex fallback.
  const unavailable = routeHead({
    loaderData: undefined,
    matches: successMatches,
    matchStatus: "success",
    fallbackPath: "/contact",
    build: () => homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "en" }),
  });

  const document = mergeHeads([rootHead(successMatches), unavailable]);

  assert.strictEqual(document.title, BRANDED_TITLE(UNAVAILABLE_COPY.pl.title));
  assert.strictEqual(document.tagsOf("name", "description"), UNAVAILABLE_COPY.pl.description);
  assert.strictEqual(document.tagsOf("name", "robots"), NOINDEX_FOLLOW);
  assert.deepStrictEqual(relsOf(document.links, "canonical"), [{ rel: "canonical", href: "https://www.remiforge.dev/contact" }]);
  // The root's discovery links and the fallback's graph are still one block together
  assert.strictEqual(relsOf(document.links, "llms").length, 1);
  assert.strictEqual(document.scripts.length, 1);
});

it("the not-found head and the not-found page tell a crawler and a visitor the same story", () => {
  // Both surfaces describe one document, and both read NOT_FOUND_COPY: a string re-authored on
  // either side would hand the SERP summary one title and the reader another.
  for (const preferredLanguage of ["en", "pl"] as const) {
    const head = fallbackHead(undefined, preferredLanguage);
    const copy = NOT_FOUND_COPY[preferredLanguage];
    // The page reads its language from the GT provider, the same way the document shell hands it one
    const page = renderToStaticMarkup(createElement(GTProvider, { locale: preferredLanguage, translations: {} }, createElement(NotFoundPage)));

    assert.include(JSON.stringify(head.meta), JSON.stringify({ title: BRANDED_TITLE(copy.title) }));
    assert.include(JSON.stringify(head.meta), JSON.stringify({ name: "description", content: copy.description }));
    // The heading carries the id the section is labelled by, so the attribute order is the
    // component's and not the assertion's; the text is what the two surfaces must agree on
    assert.match(page, new RegExp(`<h1[^>]*>${copy.title}</h1>`));
    assert.match(page, new RegExp(`<p>${copy.description}</p>`));
  }
});

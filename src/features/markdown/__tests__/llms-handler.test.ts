// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { contactHandler, educationHandler, experienceHandler, homeHandler, llmsFullTxtHandler, llmsTxtHandler } from "../services/handlers";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/link-tags";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/urls";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";
import { DEFAULT_LANGUAGE } from "@/features/meta/domain/languages";

// constants
import { CONTENT_SIGNAL } from "@/features/meta/domain/discovery";

// assets
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";

// The llms.txt routes are the GEO retrieval surface wired end-to-end through the server runtime:
// they resolve the real portfolio assets via the Datasets layer, exactly as the sitemap handler
// test does for robots.txt and sitemap.xml. The pure builder tests cannot see that wiring — a
// missing layer, a swapped language, or a dataless fallback would all still pass them.
const slugs = new Set([...experienceEn, ...experiencePl].map(({ slug }) => slug));

// The three static twin routes each answer one path; every other twin path is one experience slug.
const STATIC_TWIN_HANDLERS: Readonly<Record<string, (event: { request: Request }) => Promise<Response>>> = {
  [STATIC_PAGES["/"].mdHref]: homeHandler,
  [STATIC_PAGES["/education"].mdHref]: educationHandler,
  [STATIC_PAGES["/contact"].mdHref]: contactHandler,
};

const twinHandlerFor = (pathname: string) => STATIC_TWIN_HANDLERS[pathname] ?? experienceHandler;

// Every twin URL the index must advertise, beside the canonical the document served on it cites.
// Derived from the portfolio assets the way the index itself derives them, so an address the site
// publishes nowhere else is a missing advertisement rather than an extra route to invent.
const advertisedTwins: ReadonlyArray<readonly [twinUrl: string, canonical: string]> = [
  ...STATIC_PAGE_PATHS.map((path: string) => [markdownTwinUrl(STATIC_PAGES[path as (typeof STATIC_PAGE_PATHS)[number]].mdHref, DEFAULT_LANGUAGE), absoluteUrl(path)] as const),
  ...slugs.values().map((slug: string) => [markdownTwinUrl(experienceMarkdownPath(slug), DEFAULT_LANGUAGE), absoluteUrl(experiencePath(slug))] as const),
];

it("llms.txt serves the real portfolio assets as the AI index with the full discovery header set", async () => {
  const response = await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  // Plain-text discovery documents are always English
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  // The reuse signal and the AI-index advertisements ride on every machine-readable response
  assert.strictEqual(response.headers.get("Content-Signal"), CONTENT_SIGNAL);
  assert.strictEqual(response.headers.get("Content-Location"), LLMS_TXT_INDEX.url);
  assert.include(response.headers.get("Link") ?? "", LLMS_FULL_TXT_INDEX.url);
  // The index is ingestion guidance, never a search result
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");

  const txt = await response.text();
  assert.include(txt, "# Remi Forge");
  // Every experience slug resolved from the localized assets is advertised by its canonical URL
  for (const slug of slugs) assert.include(txt, `](https://www.remiforge.dev${experiencePath(slug)})`);
  // The static twins are advertised with their language pin
  for (const twin of ["index.md?lang=en", "education.md?lang=en", "contact.md?lang=en"]) assert.include(txt, twin);
});

it("the GEO index documents answer every request with the same English document", async () => {
  // The indexes are generated in the English source language from DEFAULT_LANGUAGE-pinned datasets
  // and their routes strip the negotiation cookie unconditionally. A `?lang=` a caller appends is
  // therefore noise the document ignores, not a variant selector: honoring it would give a shared
  // cache two representations of one public URL, and its body would no longer be the document
  // every twin and the home head advertise.
  const english = await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) });
  const pinned = await llmsTxtHandler({ request: new Request(`${LLMS_TXT_INDEX.url}?lang=pl`) });

  assert.strictEqual(pinned.headers.get("Content-Language"), "en");
  // The pin never becomes a cache variant for a document that does not read it
  assert.isNull(pinned.headers.get("Vary"));
  assert.strictEqual(await pinned.text(), await english.text());

  const full = await llmsFullTxtHandler({ request: new Request(`${LLMS_FULL_TXT_INDEX.url}?lang=pl`) });
  assert.strictEqual(full.headers.get("Content-Language"), "en");
  const englishFull = await llmsFullTxtHandler({ request: new Request(LLMS_FULL_TXT_INDEX.url) });
  assert.strictEqual(await full.text(), await englishFull.text());
});

it("llms-full.txt concatenates every twin body beneath its canonical URL", async () => {
  const response = await llmsFullTxtHandler({ request: new Request(LLMS_FULL_TXT_INDEX.url) });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(response.headers.get("Content-Location"), LLMS_FULL_TXT_INDEX.url);

  const txt = await response.text();
  // The three static pages plus every real experience, each introduced by its Source marker
  assert.strictEqual((txt.match(/^Source: /gm) ?? []).length, 3 + slugs.size);
  for (const slug of slugs) assert.include(txt, `Source: https://www.remiforge.dev${experiencePath(slug)}`);
});

it("every twin URL the index advertises is the address the twin routes answer on", async () => {
  // The index is a crawler's entry point into the twin graph: beside every page's canonical it
  // names the twin URL to fetch, so an advertised address the routes do not serve — or a page the
  // index never names — strands a fetcher on a dead-end document instead of the content it was told
  // to expect. Each advertised address is fetched here and read back against its own entry.
  const txt = await (await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) })).text();
  const advertised = [...txt.matchAll(/Markdown: (\S+)/g)].map(([, url]) => url!);

  // The advertised set is exactly the derived one: neither a page nor an experience may go unnamed
  assert.deepStrictEqual([...new Set(advertised)].sort(), advertisedTwins.map(([twinUrl]) => twinUrl).sort());

  for (const [twinUrl, canonical] of advertisedTwins) {
    const response = await twinHandlerFor(new URL(twinUrl).pathname)({ request: new Request(twinUrl) });

    assert.strictEqual(response.status, 200, `${twinUrl} is not served`);
    // The route names the same representation the index advertised, so a cache keyed on the address
    // is keyed on the document the index described
    assert.strictEqual(response.headers.get("Content-Location"), twinUrl, `${twinUrl} names another representation`);
    // ...and the document on that address cites the very canonical the index printed beside it
    assert.include(await response.text(), `canonical: ${JSON.stringify(canonical)}`, `${twinUrl} cites another page`);
  }
});

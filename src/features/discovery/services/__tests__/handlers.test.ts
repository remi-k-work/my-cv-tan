import { assert, it } from "@effect/vitest";
import { initializeGT } from "gt-tanstack-start";
import gtConfig from "../../../../../gt.config.json";
import { loadTranslations } from "@/lib/gt-translations";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/domain/urls";
import { CONTENT_SIGNAL, LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/domain/discovery";
import { llmsFullTxtHandler, llmsTxtHandler, robotsHandler, sitemapHandler } from "../handlers";
import { contactHandler, educationHandler, experienceHandler, homeHandler } from "@/features/markdown/services/handlers";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/domain/pages";
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";

// Initializes translation dictionary runtime for the twin routes the discovery index advertises.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

it("discovery document routes publish the visitor-state policy their responses need", () => {
  const pinnedRequest = (path: string) => new Request(`https://www.remiforge.dev${path}?lang=pl`);

  // AI discovery indexes and crawl policies are language-independent and omit visitor cookies.
  for (const handler of [llmsTxtHandler, llmsFullTxtHandler]) {
    assert.isFalse(handler.keepsVisitorState(new Request("https://www.remiforge.dev/llms.txt")));
    assert.isFalse(handler.keepsVisitorState(pinnedRequest("/llms.txt")));
  }

  for (const handler of [robotsHandler, sitemapHandler]) {
    assert.isFalse(handler.keepsVisitorState(new Request("https://www.remiforge.dev/sitemap.xml")));
  }
});

const slugs = new Set([...experienceEn, ...experiencePl].map(({ slug }) => slug));

const STATIC_TWIN_HANDLERS: Readonly<Record<string, (event: { request: Request }) => Promise<Response>>> = {
  [STATIC_PAGES["/"].mdHref]: homeHandler,
  [STATIC_PAGES["/education"].mdHref]: educationHandler,
  [STATIC_PAGES["/contact"].mdHref]: contactHandler,
};

const twinHandlerFor = (pathname: string) => STATIC_TWIN_HANDLERS[pathname] ?? experienceHandler;

const advertisedTwins: ReadonlyArray<readonly [twinUrl: string, canonical: string]> = [
  ...STATIC_PAGE_PATHS.map((path) => [markdownTwinUrl(STATIC_PAGES[path].mdHref, DEFAULT_LANGUAGE), absoluteUrl(path)] as const),
  ...slugs.values().map((slug: string) => [markdownTwinUrl(experienceMarkdownPath(slug), DEFAULT_LANGUAGE), absoluteUrl(experiencePath(slug))] as const),
];

it("llms.txt serves the real portfolio assets as the AI index with the full discovery header set", async () => {
  const response = await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  assert.strictEqual(response.headers.get("Content-Signal"), CONTENT_SIGNAL);
  assert.strictEqual(response.headers.get("Content-Location"), LLMS_TXT_INDEX.url);
  assert.include(response.headers.get("Link") ?? "", LLMS_FULL_TXT_INDEX.url);
  assert.notInclude(response.headers.get("Link") ?? "", `<${LLMS_TXT_INDEX.url}>;`);
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");

  const txt = await response.text();
  assert.include(txt, "# Remi Forge");
  for (const slug of slugs) assert.include(txt, `](https://www.remiforge.dev${experiencePath(slug)})`);
  for (const twin of ["index.md?lang=en", "education.md?lang=en", "contact.md?lang=en"]) assert.include(txt, twin);
});

it("the GEO index documents answer every request with the same English document", async () => {
  // Discovery indexes are unilingual English documents and ignore both query overrides and headers.
  const english = await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) });
  const negotiated = await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url, { headers: { "Accept-Language": "pl" } }) });
  const pinned = await llmsTxtHandler({ request: new Request(`${LLMS_TXT_INDEX.url}?lang=pl`) });

  for (const response of [negotiated, pinned]) {
    assert.strictEqual(response.headers.get("Content-Language"), "en");
    assert.isNull(response.headers.get("Vary"));
  }
  const englishBody = await english.text();
  assert.strictEqual(await negotiated.text(), englishBody);
  assert.strictEqual(await pinned.text(), englishBody);

  const full = await llmsFullTxtHandler({
    request: new Request(`${LLMS_FULL_TXT_INDEX.url}?lang=pl`, { headers: { "Accept-Language": "pl" } }),
  });
  assert.strictEqual(full.headers.get("Content-Language"), "en");
  assert.isNull(full.headers.get("Vary"));
  const englishFull = await llmsFullTxtHandler({ request: new Request(LLMS_FULL_TXT_INDEX.url) });
  assert.strictEqual(await full.text(), await englishFull.text());
});

it("llms-full.txt concatenates every twin body beneath its canonical URL", async () => {
  const response = await llmsFullTxtHandler({ request: new Request(LLMS_FULL_TXT_INDEX.url) });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(response.headers.get("Content-Location"), LLMS_FULL_TXT_INDEX.url);

  const txt = await response.text();
  assert.strictEqual((txt.match(/^\[Source\]\(/gm) ?? []).length, 3 + slugs.size);
  for (const slug of slugs) assert.include(txt, `[Source](https://www.remiforge.dev${experiencePath(slug)})`);
  // Every retrieval link names the deterministic English representation served by the twin routes.
  for (const [twinUrl] of advertisedTwins) assert.include(txt, `[Markdown](${twinUrl})`);
});

it("discovery document endpoints answer HEAD with GET metadata, an ETag, and no body", async () => {
  const documents = [
    [llmsTxtHandler, LLMS_TXT_INDEX.url],
    [llmsFullTxtHandler, LLMS_FULL_TXT_INDEX.url],
    [robotsHandler, absoluteUrl("/robots.txt")],
    [sitemapHandler, absoluteUrl("/sitemap.xml")],
  ] as const;

  for (const [handler, url] of documents) {
    const get = await handler({ request: new Request(url) });
    const head = await handler({ request: new Request(url, { method: "HEAD" }) });

    assert.strictEqual(head.status, get.status, url);
    assert.deepStrictEqual(Object.fromEntries(head.headers), Object.fromEntries(get.headers), url);
    assert.match(head.headers.get("ETag") ?? "", /^"[a-f0-9]{64}"$/, url);
    assert.strictEqual(await head.text(), "", url);
  }
});

it("both AI discovery indexes revalidate without downloading an unchanged body", async () => {
  for (const [handler, url] of [
    [llmsTxtHandler, LLMS_TXT_INDEX.url],
    [llmsFullTxtHandler, LLMS_FULL_TXT_INDEX.url],
  ] as const) {
    const initial = await handler({ request: new Request(url) });
    const etag = initial.headers.get("ETag");
    assert.isNotNull(etag);

    const revalidated = await handler({ request: new Request(url, { headers: { "If-None-Match": etag! } }) });

    assert.strictEqual(revalidated.status, 304);
    assert.strictEqual(revalidated.headers.get("ETag"), etag);
    assert.strictEqual(revalidated.headers.get("Content-Location"), url);
    assert.isNull(revalidated.body);
  }
});

it("every twin URL the index advertises is the address the twin routes answer on", async () => {
  const txt = await (await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) })).text();
  const advertised = [...txt.matchAll(/\]\((https:\/\/www\.remiforge\.dev\/[^)\s]+\.md\?lang=en)\)/g)].map(([, url]) => url!);

  assert.deepStrictEqual([...new Set(advertised)].sort(), advertisedTwins.map(([twinUrl]) => twinUrl).sort());

  for (const [twinUrl, canonical] of advertisedTwins) {
    const response = await twinHandlerFor(new URL(twinUrl).pathname)({ request: new Request(twinUrl) });

    assert.strictEqual(response.status, 200, `${twinUrl} is not served`);
    assert.strictEqual(response.headers.get("Content-Location"), twinUrl, `${twinUrl} names another representation`);
    assert.include(await response.text(), `canonical: ${JSON.stringify(canonical)}`, `${twinUrl} cites another page`);
  }
});
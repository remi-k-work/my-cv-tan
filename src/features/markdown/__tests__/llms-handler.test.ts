import { assert, it } from "@effect/vitest";
import { contactHandler, educationHandler, experienceHandler, homeHandler, llmsFullTxtHandler, llmsTxtHandler } from "../services/handlers";
import { LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/constants";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/urls";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";
import { DEFAULT_LANGUAGE, CONTENT_SIGNAL } from "@/features/meta/domain/constants";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";

const slugs = new Set([...experienceEn, ...experiencePl].map(({ slug }) => slug));

const STATIC_TWIN_HANDLERS: Readonly<Record<string, (event: { request: Request }) => Promise<Response>>> = {
  [STATIC_PAGES["/"].mdHref]: homeHandler,
  [STATIC_PAGES["/education"].mdHref]: educationHandler,
  [STATIC_PAGES["/contact"].mdHref]: contactHandler,
};

const twinHandlerFor = (pathname: string) => STATIC_TWIN_HANDLERS[pathname] ?? experienceHandler;

const advertisedTwins: ReadonlyArray<readonly [twinUrl: string, canonical: string]> = [
  ...STATIC_PAGE_PATHS.map(
    (path: string) => [markdownTwinUrl(STATIC_PAGES[path as (typeof STATIC_PAGE_PATHS)[number]].mdHref, DEFAULT_LANGUAGE), absoluteUrl(path)] as const
  ),
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
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");

  const txt = await response.text();
  assert.include(txt, "# Remi Forge");
  for (const slug of slugs) assert.include(txt, `](https://www.remiforge.dev${experiencePath(slug)})`);
  for (const twin of ["index.md?lang=en", "education.md?lang=en", "contact.md?lang=en"]) assert.include(txt, twin);
});

it("the GEO index documents answer every request with the same English document", async () => {
  // Discovery indexes are unilingual English documents and ignore ?lang= overrides.
  const english = await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) });
  const pinned = await llmsTxtHandler({ request: new Request(`${LLMS_TXT_INDEX.url}?lang=pl`) });

  assert.strictEqual(pinned.headers.get("Content-Language"), "en");
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
  assert.strictEqual((txt.match(/^Source: /gm) ?? []).length, 3 + slugs.size);
  for (const slug of slugs) assert.include(txt, `Source: https://www.remiforge.dev${experiencePath(slug)}`);
});

it("every twin URL the index advertises is the address the twin routes answer on", async () => {
  const txt = await (await llmsTxtHandler({ request: new Request(LLMS_TXT_INDEX.url) })).text();
  const advertised = [...txt.matchAll(/Markdown: (\S+)/g)].map(([, url]) => url!);

  assert.deepStrictEqual([...new Set(advertised)].sort(), advertisedTwins.map(([twinUrl]) => twinUrl).sort());

  for (const [twinUrl, canonical] of advertisedTwins) {
    const response = await twinHandlerFor(new URL(twinUrl).pathname)({ request: new Request(twinUrl) });

    assert.strictEqual(response.status, 200, `${twinUrl} is not served`);
    assert.strictEqual(response.headers.get("Content-Location"), twinUrl, `${twinUrl} names another representation`);
    assert.include(await response.text(), `canonical: ${JSON.stringify(canonical)}`, `${twinUrl} cites another page`);
  }
});

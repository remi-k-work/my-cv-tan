import { assert, it } from "@effect/vitest";
import { initializeGT } from "gt-tanstack-start";
import gtConfig from "../../../../../gt.config.json";
import { loadTranslations } from "@/lib/gt-translations";
import { INDEXABLE_ROBOTS } from "@/domain/http";
import { absoluteUrl, experienceMarkdownPath, experiencePath, markdownTwinUrl } from "@/features/meta/domain/urls";
import { CACHEABLE_HEADERS, CONTENT_SIGNAL, LLMS_FULL_TXT_INDEX, LLMS_TXT_INDEX } from "@/features/meta/domain/constants";
import { contactHandler, educationHandler, experienceHandler, homeHandler, llmsFullTxtHandler, llmsTxtHandler } from "../handlers";
import { robotsHandler, sitemapHandler } from "@/features/meta/domain/sitemap";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/features/meta/domain/pages";
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";

// Initializes translation dictionary runtime for unit testing.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

const pinned = (path: string) => new Request(`https://www.remiforge.dev${path}?lang=pl`);

it("a pinned Polish twin resolves its section copy from the runtime translation dictionary", async () => {
  const home = await (await homeHandler({ request: pinned("/index.md") })).text();

  assert.include(home, "## Doświadczenie");
  assert.include(home, "## Projekty do Portfolio");
  assert.include(home, "## Strony");
  assert.include(home, "[Edukacja i Certyfikaty](https://www.remiforge.dev/education.md?lang=pl)");
  assert.include(home, "Programista stron internetowych");

  const education = await (await educationHandler({ request: pinned("/education.md") })).text();
  assert.include(education, "## Edukacja");
  assert.include(education, "## Dokumenty");

  const contact = await (await contactHandler({ request: pinned("/contact.md") })).text();
  assert.include(contact, "## Kanały");
  assert.include(contact, "Formularz Kontaktowy:");
  assert.include(contact, "Lokalizacja: Rzeszów, Polska");
});

it("a pinned Polish twin translates its detail sections and link labels", async () => {
  const slug = experienceEn[0]!.slug;
  const detail = await (await experienceHandler({ request: pinned(`/${encodeURIComponent(slug)}.md`) })).text();

  assert.include(detail, "## Opis");
  assert.include(detail, "## Szczegóły");
  assert.include(detail, "## Wykorzystane Umiejętności");
  assert.include(detail, "Rola: ");
  assert.include(detail, "[Strona główna](https://www.remiforge.dev/index.md?lang=pl)");
});

it("an English-pinned twin stays the source language no dictionary lookup can change", async () => {
  const home = await (await homeHandler({ request: new Request("https://www.remiforge.dev/index.md?lang=en") })).text();

  assert.include(home, "## Experience");
  assert.include(home, "## Portfolio Projects");
  assert.notInclude(home, "## Doświadczenie");
});

// Builds a language-pinned request URL.
const pinned2 = (path: string, lang: "en" | "pl") => new Request(`https://www.remiforge.dev${path}?lang=${lang}`);

// Extracts the canonical URI reference from RFC 8288 Link header.
const headerCanonical = (header: string | null) =>
  header
    ?.split(", ")
    .find((entry) => entry.includes(`rel="canonical"`))
    ?.match(/^<([^>]+)>/)?.[1];

const firstSlug = experienceEn[0]!.slug;

it("a served twin's response canonical names the very page its frontmatter cites", async () => {
  for (const [handler, path] of [
    [homeHandler, "/index.md"],
    [educationHandler, "/education.md"],
    [contactHandler, "/contact.md"],
  ] as const) {
    const response = await handler({ request: pinned2(path, "en") });
    const canonical = headerCanonical(response.headers.get("Link"));

    assert.isDefined(canonical, `${path} advertised no canonical in its Link header`);
    assert.include(await response.text(), `canonical: ${JSON.stringify(canonical)}`);
  }

  const detail = await experienceHandler({ request: pinned2(`/${encodeURIComponent(firstSlug)}.md`, "en") });
  const detailCanonical = headerCanonical(detail.headers.get("Link"));

  assert.strictEqual(detailCanonical, absoluteUrl(experiencePath(firstSlug)));
  assert.include(await detail.text(), `canonical: ${JSON.stringify(detailCanonical)}`);
});

it("the home twin serves the full indexable envelope behind the pinned language", async () => {
  const response = await homeHandler({ request: pinned2("/index.md", "en") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.strictEqual(response.headers.get("Content-Language"), "en");
  // Language pin selects the deterministic cache variant, stripping negotiation Vary.
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/index.md?lang=en");
  assert.isNull(response.headers.get("Vary"));
  assert.strictEqual(response.headers.get("Cache-Control"), CACHEABLE_HEADERS["Cache-Control"]);
  assert.strictEqual(response.headers.get("X-Robots-Tag"), INDEXABLE_ROBOTS);

  const link = response.headers.get("Link") ?? "";
  assert.include(link, '<https://www.remiforge.dev/>; rel="canonical"');
  assert.include(link, "llms.txt");
  assert.include(link, "llms-full.txt");
  assert.include(link, 'rel="alternate"; type="text/markdown"; hreflang="pl"');

  const body = await response.text();
  assert.include(body, `canonical: "https://www.remiforge.dev/"`);
  assert.include(body, `title: "Remi Forge ● Web Developer in Rzeszów, Poland"`);
  assert.include(body, "## Experience");
  assert.include(body, "## Portfolio Projects");
  assert.strictEqual((body.match(/^# /gm) ?? []).length, 1);
});

it("the education twin resolves the school list dataset through the runtime", async () => {
  const response = await educationHandler({ request: pinned2("/education.md", "en") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  const body = await response.text();
  assert.include(body, `canonical: "https://www.remiforge.dev/education"`);
  assert.include(body, "## Documents");
});

it("a pinned Polish request localizes the document envelope and its frontmatter", async () => {
  const response = await contactHandler({ request: pinned2("/contact.md", "pl") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Language"), "pl");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/contact.md?lang=pl");

  const body = await response.text();
  assert.include(body, `lang: "pl"`);
  assert.include(body, `title: "Remi Forge ● Kontakt"`);
  assert.include(body, "## Kanały");
});

it("the experience twin renders the real page identity behind its canonical URL", async () => {
  const response = await experienceHandler({ request: pinned2(`/${encodeURIComponent(firstSlug)}.md`, "en") });

  assert.strictEqual(response.status, 200);
  const body = await response.text();
  assert.include(body, `canonical: ${JSON.stringify(absoluteUrl(experiencePath(firstSlug)))}`);
  assert.strictEqual(response.headers.get("Content-Location"), `${absoluteUrl(experiencePath(firstSlug))}.md?lang=en`);
});

it("an unknown slug is a noindex 404 that still names the queried twin", async () => {
  const response = await experienceHandler({ request: pinned2("/no-such-page.md", "en") });

  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/no-such-page.md?lang=en");
  assert.isNull(response.headers.get("Vary"));

  const body = await response.text();
  assert.include(body, "# Not Found");
  assert.include(body, "No page for slug");
  assert.include(body, "https://www.remiforge.dev/llms.txt");
});

it("paths the twin route cannot represent are 404s without a fabricated location", async () => {
  const nested = await experienceHandler({ request: pinned2("/parent/child.md", "en") });
  assert.strictEqual(nested.status, 404);
  assert.isNull(nested.headers.get("Content-Location"));

  const malformed = await experienceHandler({ request: pinned2("/%zz.md", "en") });
  assert.strictEqual(malformed.status, 404);
  assert.isNull(malformed.headers.get("Content-Location"));
});

it("the detail twin the home page links to is the document the detail route answers", async () => {
  const home = await (await homeHandler({ request: pinned2("/index.md", "en") })).text();
  const slug = experienceEn[0]!.slug;
  const advertised = `${absoluteUrl(experienceMarkdownPath(slug))}?lang=en`;

  assert.include(home, advertised, "the home twin must advertise the detail twin a crawler can fetch");

  const detail = await experienceHandler({ request: pinned2(`/${encodeURIComponent(slug)}.md`, "en") });

  assert.strictEqual(detail.status, 200);
  assert.include(await detail.text(), `canonical: ${JSON.stringify(absoluteUrl(experiencePath(slug)))}`);
  assert.strictEqual(detail.headers.get("Content-Location"), advertised);
});

it("every document route publishes the visitor-state policy its response needs", async () => {
  const pinnedRequest = (path: string) => new Request(`https://www.remiforge.dev${path}?lang=pl`);

  // Language-negotiated twins preserve visitor cookie unless explicitly pinned via ?lang=.
  for (const handler of [homeHandler, educationHandler, contactHandler, experienceHandler]) {
    assert.isTrue(handler.keepsVisitorState(new Request("https://www.remiforge.dev/index.md")));
    assert.isFalse(handler.keepsVisitorState(pinnedRequest("/index.md")));
  }

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

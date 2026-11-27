import { assert, it } from "@effect/vitest";
import { initializeGT } from "gt-tanstack-start";
import gtConfig from "../../../../../gt.config.json";
import { loadTranslations } from "@/lib/gt-translations";
import { INDEXABLE_ROBOTS } from "@/domain/http";
import { absoluteUrl, experienceMarkdownPath, experiencePath } from "@/domain/urls";
import { CACHEABLE_HEADERS } from "@/lib/http-response";
import { contactHandler, educationHandler, experienceHandler, homeHandler } from "../handlers";
import { contactHead, educationHead, homeHead } from "@/features/meta/domain/page-head";
import { joinLinkHeader } from "@/domain/links";
import { stablePageTitles } from "@/features/markdown/__tests__/fixtures";
import experienceEn from "@/assets/data/en/experience.json";

// types
import type { PreferredLanguage } from "@/domain/models";

// Initializes translation dictionary runtime for unit testing.
initializeGT({ ...gtConfig, loadTranslations, _reload: () => {} });

const pinned = (path: string, lang: "en" | "pl" = "pl") => new Request(`https://www.remiforge.dev${path}?lang=${lang}`);

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
  assert.include(contact, "[Formularz Kontaktowy](https://www.remiforge.dev/contact)");
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
    const response = await handler({ request: pinned(path, "en") });
    const canonical = headerCanonical(response.headers.get("Link"));

    assert.isDefined(canonical, `${path} advertised no canonical in its Link header`);
    assert.include(await response.text(), `canonical: ${JSON.stringify(canonical)}`);
  }

  const detail = await experienceHandler({ request: pinned(`/${encodeURIComponent(firstSlug)}.md`, "en") });
  const detailCanonical = headerCanonical(detail.headers.get("Link"));

  assert.strictEqual(detailCanonical, absoluteUrl(experiencePath(firstSlug)));
  assert.include(await detail.text(), `canonical: ${JSON.stringify(detailCanonical)}`);
});

it("HTML heads and Markdown responses publish the same reciprocal language cluster", async () => {
  const pages = [
    [homeHandler, (preferredLanguage: PreferredLanguage) => homeHead({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage })],
    [educationHandler, (preferredLanguage: PreferredLanguage) => educationHead({ pageTitles: stablePageTitles, educationList: [], preferredLanguage })],
    [contactHandler, (preferredLanguage: PreferredLanguage) => contactHead({ pageTitles: stablePageTitles, preferredLanguage })],
  ] as const;

  for (const [handler, headFor] of pages) {
    for (const preferredLanguage of ["en", "pl"] as const) {
      const variants = headFor(preferredLanguage).links.filter(({ type }) => type === "text/markdown");
      const requested = variants.find(({ hrefLang }) => hrefLang === preferredLanguage);
      assert.isDefined(requested);

      const response = await handler({ request: new Request(requested!.href) });
      const responseLinks = response.headers.get("Link") ?? "";

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get("Content-Location"), requested!.href);
      for (const variant of variants) assert.include(responseLinks, joinLinkHeader([variant]));
    }
  }
});

it("the home twin serves the full indexable envelope behind the pinned language", async () => {
  const response = await homeHandler({ request: pinned("/index.md", "en") });

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
  const response = await educationHandler({ request: pinned("/education.md", "en") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  const body = await response.text();
  assert.include(body, `canonical: "https://www.remiforge.dev/education"`);
  assert.include(body, "## Documents");
});

it("a pinned Polish request localizes the document envelope and its frontmatter", async () => {
  const response = await contactHandler({ request: pinned("/contact.md", "pl") });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get("Content-Language"), "pl");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/contact.md?lang=pl");
  assert.isNull(response.headers.get("Vary"));

  const body = await response.text();
  assert.include(body, `lang: "pl"`);
  assert.include(body, `title: "Remi Forge ● Kontakt"`);
  assert.include(body, "## Kanały");
});

it("the experience twin renders the real page identity behind its canonical URL", async () => {
  const response = await experienceHandler({ request: pinned(`/${encodeURIComponent(firstSlug)}.md`, "en") });

  assert.strictEqual(response.status, 200);
  const body = await response.text();
  assert.include(body, `canonical: ${JSON.stringify(absoluteUrl(experiencePath(firstSlug)))}`);
  assert.strictEqual(response.headers.get("Content-Location"), `${absoluteUrl(experiencePath(firstSlug))}.md?lang=en`);
});

it("an unknown slug is a noindex 404 that still names the queried twin", async () => {
  const response = await experienceHandler({ request: pinned("/no-such-page.md", "en") });

  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.strictEqual(response.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/no-such-page.md?lang=en");
  assert.strictEqual(response.headers.get("Vary"), "Cookie, Accept-Language");

  const body = await response.text();
  assert.include(body, "# Not Found");
  assert.include(body, "No page for slug");
  assert.include(body, "https://www.remiforge.dev/llms.txt");
});

it("a Polish missing-slug response localizes its body and envelope", async () => {
  const response = await experienceHandler({ request: pinned("/no-such-page.md", "pl") });

  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.headers.get("Content-Language"), "pl");
  assert.strictEqual(response.headers.get("Content-Location"), "https://www.remiforge.dev/no-such-page.md?lang=pl");
  assert.strictEqual(response.headers.get("X-Robots-Tag"), "noindex, follow");

  const body = await response.text();
  assert.include(body, 'lang: "pl"');
  assert.include(body, "# Nie znaleziono");
  assert.include(body, "Nie znaleziono strony dla identyfikatora");
  assert.include(body, "Dokument Markdown dla adresu /no-such-page nie istnieje.");
});

it("paths the twin route cannot represent are 404s without a fabricated location", async () => {
  const nested = await experienceHandler({ request: pinned("/parent/child.md", "en") });
  assert.strictEqual(nested.status, 404);
  assert.isNull(nested.headers.get("Content-Location"));

  const malformed = await experienceHandler({ request: pinned("/%zz.md", "en") });
  assert.strictEqual(malformed.status, 404);
  assert.isNull(malformed.headers.get("Content-Location"));
});

it("the detail twin the home page links to is the document the detail route answers", async () => {
  const home = await (await homeHandler({ request: pinned("/index.md", "en") })).text();
  const slug = experienceEn[0]!.slug;
  const advertised = `${absoluteUrl(experienceMarkdownPath(slug))}?lang=en`;

  assert.include(home, advertised, "the home twin must advertise the detail twin a crawler can fetch");

  const detail = await experienceHandler({ request: pinned(`/${encodeURIComponent(slug)}.md`, "en") });

  assert.strictEqual(detail.status, 200);
  assert.include(await detail.text(), `canonical: ${JSON.stringify(absoluteUrl(experiencePath(slug)))}`);
  assert.strictEqual(detail.headers.get("Content-Location"), advertised);
});

it("markdown document routes publish the visitor-state policy their responses need", () => {
  const pinnedRequest = (path: string) => new Request(`https://www.remiforge.dev${path}?lang=pl`);

  // Exercise each negotiated twin through its own public route, including the dynamic detail route.
  for (const [handler, path] of [
    [homeHandler, "/index.md"],
    [educationHandler, "/education.md"],
    [contactHandler, "/contact.md"],
    [experienceHandler, experienceMarkdownPath(firstSlug)],
  ] as const) {
    assert.isTrue(handler.keepsVisitorState(new Request(absoluteUrl(path))));
    assert.isFalse(handler.keepsVisitorState(pinnedRequest(path)));
  }
});

it("markdown document endpoints answer HEAD with GET metadata, an ETag, and no body", async () => {
  const documents = [
    [homeHandler, absoluteUrl("/index.md?lang=en")],
    [educationHandler, absoluteUrl("/education.md?lang=en")],
    [contactHandler, absoluteUrl("/contact.md?lang=en")],
    [experienceHandler, absoluteUrl(`${experienceMarkdownPath(firstSlug)}?lang=en`)],
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

it("public machine-readable documents revalidate without downloading an unchanged body", async () => {
  const url = "https://www.remiforge.dev/index.md?lang=en";
  const initial = await homeHandler({ request: new Request(url) });
  const etag = initial.headers.get("ETag");

  assert.strictEqual(initial.status, 200);
  assert.match(etag ?? "", /^"[a-f0-9]{64}"$/);

  const revalidated = await homeHandler({ request: new Request(url, { headers: { "If-None-Match": etag! } }) });

  assert.strictEqual(revalidated.status, 304);
  assert.strictEqual(revalidated.headers.get("ETag"), etag);
  assert.strictEqual(revalidated.headers.get("Content-Location"), url);
  assert.strictEqual(revalidated.headers.get("Cache-Control"), CACHEABLE_HEADERS["Cache-Control"]);
  assert.isNull(revalidated.body);
});
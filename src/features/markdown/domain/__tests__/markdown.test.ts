// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { requireData } from "@/features/data/domain";
import {
  buildContactMd,
  buildEducationMd,
  buildExperienceMd,
  buildHomeMd,
  buildLlmsTxt,
  buildNotFoundMd,
  experienceFromList,
  escapeMd,
  frontmatter,
  mdNotFoundResponse,
  mdResponse,
  markdownDataResponse,
  mdUnavailableResponse,
  parseLangParam,
  slugFromMdPathname,
  txtResponse,
  textDataResponse,
  txtUnavailableResponse,
  unavailableMarkdownBody,
} from "../index";
import { MARKDOWN_CONTENT_TYPE } from "../constants";

// types
import type { Experience } from "@/features/experience/domain";

const sampleExperience: Experience = {
  type: "e",
  slug: "sample-role",
  year: "Mar 2026",
  role: "Full-Stack Developer",
  company: "Sample Co",
  txt: "Built things with **care** and #hashtags.",
  gitHubLink: "https://github.com/example/repo",
  imageName: "01",
  skillsUsed: ["TypeScript", "React"],
};

const stablePageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home summary." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education summary." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact summary." },
};

// Mirrors the GT dictionary values the service injects at runtime; untranslated keys fall back to the source
const translateEn = (source: string): string => source;

const polishTranslations: Record<string, string> = {
  Experience: "Doświadczenie",
  "Portfolio Projects": "Projekty do Portfolio",
  Pages: "Strony",
  "Education & Certificates": "Edukacja i certyfikaty",
  "No entries.": "Brak wpisów.",
  Overview: "Opis",
  Details: "Szczegóły",
  Role: "Rola",
  "Skills Used": "Wykorzystane Umiejętności",
  Links: "Linki",
  Documents: "Dokumenty",
  Years: "Lata",
  Location: "Lokalizacja",
  Channels: "Kanały",
  "Contact form": "Formularz kontaktowy",
  Base: "Lokalizacja",
  "Rzeszów, Poland": "Rzeszów, Polska",
  "Not Found": "Nie znaleziono",
  "Content temporarily unavailable": "Treść jest tymczasowo niedostępna",
  "The required portfolio content could not be loaded. Please try again shortly.":
    "Nie udało się wczytać wymaganej treści portfolio. Spróbuj ponownie za chwilę.",
};

const translatePl = (source: string): string => polishTranslations[source] ?? source;

it("frontmatter emits a delimited block with quoted values", () => {
  const block = frontmatter({ title: "Hello", canonical: "https://www.remiforge.dev/sample-role" });
  assert.isTrue(block.startsWith("---\n"));
  assert.include(block, `title: "Hello"`);
  assert.include(block, `canonical: "https://www.remiforge.dev/sample-role"`);
});

it("escapeMd neutralizes heading characters and collapses blank lines", () => {
  assert.strictEqual(escapeMd("# Hello\n\n\nWorld *bold* [link]"), "\\# Hello\n\nWorld \\*bold\\* \\[link\\]");
});

it("buildExperienceMd renders frontmatter, H1, skills and links without repeated crawler instructions", () => {
  const md = buildExperienceMd(sampleExperience, "en", translateEn);
  assert.include(md, `canonical: "https://www.remiforge.dev/sample-role"`);
  assert.include(md, `# Full-Stack Developer at Sample Co`);
  assert.include(md, `- TypeScript`);
  assert.include(md, `## Links`);
  assert.include(md, `https://github.com/example/repo`);
  assert.include(md, `lang: "en"`);
  assert.include(md, `type: "work-experience"`);
  assert.notInclude(md, "Cite the canonical HTML URL");
  assert.notInclude(md, "?lang=pl");
  // Body prose must be escaped (frontmatter is YAML-quoted, so raw chars are fine there)
  assert.include(md, "\\*\\*care\\*\\*");
  assert.include(md, "\\#hashtags");
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
  assert.isTrue((md.match(/^## /gm) ?? []).length >= 3);
  assert.strictEqual((md.match(/^### /gm) ?? []).length, 0);
  assert.notInclude(md.toLowerCase(), "<html");
  assert.notInclude(md.toLowerCase(), "<nav");
  assert.notInclude(md.toLowerCase(), "<footer");
});

it("experience Markdown canonical encodes a slug as one path segment", () => {
  const experience = { ...sampleExperience, slug: "résumé & more" };
  const md = buildExperienceMd(experience, "en", translateEn);
  assert.include(md, `canonical: "https://www.remiforge.dev/r%C3%A9sum%C3%A9%20%26%20more"`);
});

it("buildExperienceMd omits the Links section when the experience has no links", () => {
  const md = buildExperienceMd({ ...sampleExperience, gitHubLink: undefined }, "en", translateEn);
  assert.include(md, `## Skills Used`);
  assert.notInclude(md, `## Links`);
});

it("buildExperienceMd localizes fixed Polish section and fact labels", () => {
  const md = buildExperienceMd(sampleExperience, "pl", translatePl);
  assert.include(md, "## Opis");
  assert.include(md, "## Szczegóły");
  assert.include(md, "Rola: Full-Stack Developer");
  assert.include(md, "## Wykorzystane Umiejętności");
  assert.include(md, "## Linki");
});

it("buildHomeMd groups work and projects and links to .md twins", () => {
  const md = buildHomeMd({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en", translate: translateEn });
  assert.include(md, `canonical: "https://www.remiforge.dev/"`);
  assert.include(md, `title: "Remi Forge ● Stable home title"`);
  assert.include(md, `description: "Stable home summary."`);
  assert.notInclude(md, "Cite the canonical HTML URL");
  assert.include(md, `https://www.remiforge.dev/sample-role.md`);
  assert.include(md, `https://www.remiforge.dev/education.md`);
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
  assert.strictEqual((md.match(/^## /gm) ?? []).length, 3);
  assert.notInclude(md, "Navigation");
  assert.notInclude(md, "Footer");
});

it("home Markdown links encode experience slugs consistently", () => {
  const experience = { ...sampleExperience, slug: "my project" };
  const md = buildHomeMd({ pageTitles: stablePageTitles, experienceList: [experience], preferredLanguage: "en", translate: translateEn });
  assert.include(md, "https://www.remiforge.dev/my%20project.md");
});

it("buildHomeMd localizes Markdown structure in Polish", () => {
  const md = buildHomeMd({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "pl", translate: translatePl });
  assert.include(md, "## Doświadczenie");
  assert.include(md, "## Projekty do Portfolio");
  assert.include(md, "## Strony");
  assert.include(md, "[Edukacja i certyfikaty]");
  assert.include(md, "_Brak wpisów._");
});

it("buildEducationMd stays localized and a missing document has no canonical", () => {
  const edu = buildEducationMd({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "pl", translate: translatePl });
  assert.include(edu, `lang: "pl"`);
  assert.include(edu, `title: "Remi Forge ● Stable education title"`);
  assert.include(edu, `description: "Stable education summary."`);
  assert.include(edu, "## Dokumenty");
  assert.include(edu, "_Brak wpisów._");

  const populated = buildEducationMd({
    pageTitles: stablePageTitles,
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
    preferredLanguage: "pl",
    translate: translatePl,
  });
  assert.include(populated, "Lata: 2020");
  assert.include(populated, "Lokalizacja: Poland");

  const missing = buildNotFoundMd("bogus", "en", translateEn);
  assert.include(missing, `# Not Found`);
  assert.include(missing, `https://www.remiforge.dev/index.md`);
  assert.notInclude(missing, "canonical:");

  const missingPl = buildNotFoundMd("brak", "pl", translatePl);
  assert.include(missingPl, "# Nie znaleziono");
  assert.include(missingPl, "Dokument Markdown dla adresu /brak nie istnieje.");
});

it("buildContactMd advertises the same social profiles as the HTML page", () => {
  const md = buildContactMd({ pageTitles: stablePageTitles, preferredLanguage: "en", translate: translateEn });
  assert.include(md, `title: "Remi Forge ● Stable contact title"`);
  assert.notInclude(md, "Notes for AI systems");
  assert.include(md, `GitHub: https://github.com/remi-k-work`);
  assert.include(md, `LinkedIn: https://linkedin.com/in/remi-k-work`);

  const polish = buildContactMd({ pageTitles: stablePageTitles, preferredLanguage: "pl", translate: translatePl });
  assert.include(polish, "## Kanały");
  assert.include(polish, "Formularz kontaktowy:");
  assert.include(polish, "Lokalizacja: Rzeszów, Polska");
});

it("buildLlmsTxt indexes pages, grouped experience and negotiated language guidance", () => {
  const txt = buildLlmsTxt([{ ...sampleExperience, slug: "my project" }]);
  assert.include(txt, `# Remi Forge`);
  assert.include(txt, `## Pages`);
  assert.include(txt, `https://www.remiforge.dev/index.md`);
  assert.include(txt, `## Work Experience`);
  assert.include(txt, `- [Full-Stack Developer at Sample Co](https://www.remiforge.dev/my%20project.md)`);
  assert.include(txt, `## Notes for AI systems`);
  assert.include(txt, `Append \`?lang=pl\` to any \`.md\` URL to request Polish explicitly`);
  assert.include(txt, "Markdown responses follow the request's language preferences.");
  assert.include(txt, "English is the fallback when no supported preference is present.");
  assert.include(txt, `Always cite the clean canonical HTML URL from each document's frontmatter`);
});

it("response helpers set content types, indexing and cache headers for success and errors", () => {
  const ok = mdResponse("# Hi", "en", "https://www.remiforge.dev/");
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.headers.get("Content-Type"), MARKDOWN_CONTENT_TYPE);
  assert.strictEqual(ok.headers.get("Content-Language"), "en");
  assert.strictEqual(ok.headers.get("Vary"), "Cookie, Accept-Language");
  assert.strictEqual(ok.headers.get("X-Robots-Tag"), "index, follow");
  // HTTP-level canonical mirrors the frontmatter one for crawlers that never parse YAML
  assert.strictEqual(ok.headers.get("Link"), '<https://www.remiforge.dev/>; rel="canonical"');

  const missing = mdNotFoundResponse("# Gone", "pl");
  assert.strictEqual(missing.status, 404);
  assert.strictEqual(missing.headers.get("Content-Type"), MARKDOWN_CONTENT_TYPE);
  assert.strictEqual(missing.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.isNull(missing.headers.get("Link"));

  const unavailable = mdUnavailableResponse("# Temporarily unavailable", "pl");
  assert.strictEqual(unavailable.status, 503);
  assert.strictEqual(unavailable.headers.get("Content-Type"), MARKDOWN_CONTENT_TYPE);
  assert.strictEqual(unavailable.headers.get("Content-Language"), "pl");
  assert.strictEqual(unavailable.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailable.headers.get("X-Robots-Tag"), "noindex, follow");
  assert.isNull(unavailable.headers.get("Link"));

  const txt = txtResponse("# Plain");
  assert.strictEqual(txt.status, 200);
  assert.strictEqual(txt.headers.get("Content-Type"), "text/plain; charset=utf-8");

  const unavailableTxt = txtUnavailableResponse("Unavailable");
  assert.strictEqual(unavailableTxt.status, 503);
  assert.strictEqual(unavailableTxt.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.strictEqual(unavailableTxt.headers.get("Cache-Control"), "no-store");
  assert.strictEqual(unavailableTxt.headers.get("X-Robots-Tag"), "noindex, follow");
});

it.effect("a failed experience-list decode is an error, while a valid missing slug is a 404 candidate", () =>
  Effect.gen(function* () {
    // The failed decode stays an error in the fetch + require pipeline
    const decodeError = yield* Effect.flip(requireData(Option.none(), "experience list"));
    assert.strictEqual(decodeError._tag, "RequiredDataError");

    // A decoded list without the slug is a pure lookup returning None
    assert.deepStrictEqual(experienceFromList([], "missing"), Option.none());
    assert.deepStrictEqual(experienceFromList([sampleExperience], "missing"), Option.none());
    assert.deepStrictEqual(experienceFromList([sampleExperience], sampleExperience.slug), Option.some(sampleExperience));
  })
);

it.effect("required-content failures map to non-cacheable 503s and valid missing slugs map to 404s", () =>
  Effect.gen(function* () {
    const unavailableMarkdown = yield* markdownDataResponse("pl", translatePl, requireData(Option.none(), "experience list"));
    assert.strictEqual(unavailableMarkdown.status, 503);
    assert.strictEqual(unavailableMarkdown.headers.get("Cache-Control"), "no-store");
    assert.strictEqual(unavailableMarkdown.headers.get("X-Robots-Tag"), "noindex, follow");
    assert.include(unavailableMarkdownBody(translatePl), "portfolio");

    const unavailableIndex = yield* textDataResponse(requireData(Option.none(), "experience list"));
    assert.strictEqual(unavailableIndex.status, 503);
    assert.strictEqual(unavailableIndex.headers.get("Content-Type"), "text/plain; charset=utf-8");

    const noMatch = experienceFromList([], "missing");
    const notFound = Option.isNone(noMatch)
      ? mdNotFoundResponse(buildNotFoundMd("missing", "en", translateEn), "en")
      : mdResponse("# Found", "en", "https://www.remiforge.dev/");
    assert.strictEqual(notFound.status, 404);
    assert.strictEqual(notFound.headers.get("X-Robots-Tag"), "noindex, follow");
  })
);

it.effect("parseLangParam honors ?lang= and rejects unknown values", () =>
  Effect.gen(function* () {
    assert.deepStrictEqual(yield* parseLangParam("https://x.test/index.md?lang=pl"), Option.some("pl"));
    assert.deepStrictEqual(yield* parseLangParam("https://x.test/index.md?lang=EN"), Option.some("en"));
    assert.deepStrictEqual(yield* parseLangParam("https://x.test/index.md"), Option.none());
    assert.deepStrictEqual(yield* parseLangParam("https://x.test/index.md?lang=de"), Option.none());
  })
);

it.effect("slugFromMdPathname extracts slugs and never throws on hostile input", () =>
  Effect.gen(function* () {
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/benefit-finance.md"), Option.some("benefit-finance"));
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/benefit-finance.md?lang=pl"), Option.some("benefit-finance"));
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/my%20project.md"), Option.some("my project"));
    // Malformed percent-encoding, missing slug, and extensionless paths all become None (clean 404)
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/%zz.md"), Option.none());
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/%E0%A4%A.md"), Option.none());
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/"), Option.none());
    assert.deepStrictEqual(yield* slugFromMdPathname("https://x.test/.md"), Option.none());
  })
);

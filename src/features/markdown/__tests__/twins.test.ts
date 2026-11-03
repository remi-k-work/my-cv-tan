// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { buildExperienceMd } from "../domain/experience";
import { buildContactMd, buildEducationMd, buildHomeMd, buildNotFoundMd } from "../domain/pages";
import { escapeMd, escapeMdInline } from "../domain/text";
import { AI_INDEX_MARKDOWN_LINKS, frontmatter, mdEmptyMarker, twinIndexLinks } from "../domain/blocks";

import { STATIC_PAGES, type StaticPageCopy } from "@/features/meta/domain/static-pages";

// types
import type { PagePath, PageTitles } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";

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

const stablePageTitles: PageTitles = {
  "/": { eyebrow: "Home", heading: "Stable home title", intro: "Stable home summary." },
  "/education": { eyebrow: "Education", heading: "Stable education title", intro: "Stable education summary." },
  "/contact": { eyebrow: "Contact", heading: "Stable contact title", intro: "Stable contact summary." },
};

// Mirrors the GT dictionary values the service injects at runtime; untranslated keys fall back to the source
const translateEn = (source: string): string => source;

const polishTranslations: Record<string, string> = {
  Experience: "Doświadczenie",
  "Portfolio Projects": "Projekty do Portfolio",
  Education: "Edukacja",
  Pages: "Strony",
  "Home page": "Strona główna",
  "Education & Certificates": "Edukacja i certyfikaty",
  Contact: "Kontakt",
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
  "Contact Form": "Formularz Kontaktowy",
  Base: "Lokalizacja",
  "Rzeszów, Poland": "Rzeszów, Polska",
  "Not Found": "Nie znaleziono",
  // The link labels are the same source strings the HTML link chips translate, so the Polish
  // twin prints the dictionary's Polish labels instead of English strings no key covers
  "GitHub Repo": "Repozytorium GitHub",
  "Live Link": "Link na Żywo",
  "Watch Video": "Zobacz Video",
};

const translatePl = (source: string): string => polishTranslations[source] ?? source;

it("frontmatter emits a delimited block with quoted values", () => {
  const block = frontmatter({ title: "Hello", canonical: "https://www.remiforge.dev/sample-role" });
  assert.isTrue(block.startsWith("---\n"));
  assert.include(block, `title: "Hello"`);
  assert.include(block, `canonical: "https://www.remiforge.dev/sample-role"`);
});

it("frontmatter escapes the characters YAML double-quoted scalars reject, which JSON.stringify leaves raw", () => {
  // JSON quoting is valid for YAML quoted scalars except for DEL, the C1 controls and the two
  // Unicode line separators: a content value carrying one of them would otherwise produce frontmatter
  // a YAML parser rejects outright, which is a document an indexer cannot read at all.
  const block = frontmatter({ title: "bel\u007f c1\u0085 ls\u2028 ps\u2029" });

  assert.notInclude(block, "\u007f");
  assert.notInclude(block, "\u0085");
  assert.notInclude(block, "\u2028");
  assert.notInclude(block, "\u2029");
  // The escapes are transparent: a YAML parser reads back the original text
  assert.include(block, `title: "bel\\u007f c1\\u0085 ls\\u2028 ps\\u2029"`);
});

it("mdEmptyMarker keeps translated copy inside the emphasis span", () => {
  // A dictionary value ending in "_" would close the italic span early and leave stray markup
  // behind, so the marker escapes the translated text the same way every other content string
  const marker = mdEmptyMarker((source) => (source === "No entries." ? "Brak wpisów_" : source));
  assert.strictEqual(marker, "_Brak wpisów\\__");
});

it("a fact label or value cannot fabricate markup from inside a bullet", () => {
  // Every `Label: value` line runs through mdFact, so a translated label and a content value are the
  // two halves that must both stay inline text: an unescaped "]" would close a link label early and
  // hand a parser structure the site never authored
  const md = buildEducationMd({
    pageTitles: stablePageTitles,
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
    preferredLanguage: "en",
    translate: (source: string) => (source === "Years" ? "Evil]_# [" : source),
  });

  // The brackets that could close a link label, and the emphasis marker that could open a span,
  // are both neutralized — while the bullet stays one bullet
  assert.include(md, "- Evil\\]\\_# \\[: 2020");
  assert.notInclude(md, "- Evil]");
  // The emphasis marker is escaped too, so a label cannot open a span the document never closes
  assert.notInclude(md, "- _");
  // The document keeps exactly one H1: no label ever reached the heading level
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
});

it("an unparseable twin address never quotes a fabricated slug", () => {
  // The URL carried no decodable slug, so the document says so: an AI citation must never read
  // back an identifier ("unknown") that was never requested
  const md = buildNotFoundMd({ slug: Option.none(), preferredLanguage: "en", translate: translateEn });
  assert.include(md, "No Markdown document exists for this address.");
  assert.include(md, "No page for this address.");
  assert.notInclude(md, "unknown");
  // The language variants of the same fallback stay consistent for a Polish reader
  const pl = buildNotFoundMd({ slug: Option.none(), preferredLanguage: "pl", translate: translatePl });
  assert.include(pl, "Dokument Markdown dla tego adresu nie istnieje.");
});

it("escapeMd neutralizes heading characters and collapses blank lines", () => {
  assert.strictEqual(escapeMd("# Hello\n\n\nWorld *bold* [link]"), "\\# Hello\n\nWorld \\*bold\\* \\[link\\]");
  // Bare "=" / "--" runs under a paragraph would otherwise become setext headings
  assert.strictEqual(escapeMd("Title\n====="), "Title\n\\=====");
  assert.strictEqual(escapeMd("Sub\n--"), "Sub\n\\--");
  // Inline "=" characters are meaningless and stay untouched
  assert.strictEqual(escapeMd("plain = math"), "plain = math");
});

it("escapeMd neutralizes the image constructor, so authored data cannot fabricate one", () => {
  // The "!" rule reads the raw author text and therefore has to run before the bracket rule: once
  // that rule has written "\[" the lookahead no longer matches, and the "!" would never be escaped
  assert.strictEqual(escapeMd("![alt](https://evil.test/a-b.png)"), "\\!\\[alt\\](https://evil.test/a-b.png)");
  // An image marker inside prose is neutralized the same way
  assert.strictEqual(escapeMdInline("a ![b](c) d"), "a \\!\\[b\\](c) d");
});

it("escapeMd neutralizes list markers at line end, not only before inline content", () => {
  // A bare marker opens an empty list item in CommonMark, so trailing markers are structure too
  assert.strictEqual(escapeMd("Come and see\n-"), "Come and see\n\\-");
  assert.strictEqual(escapeMd("Ordered steps\n1."), "Ordered steps\n1\\.");
  assert.strictEqual(escapeMd("Ordered steps\n12)"), "Ordered steps\n12\\)");
  // The inline case keeps working: the marker binds at the line start either way
  assert.strictEqual(escapeMd("- item one"), "\\- item one");
  // An ordered marker escapes at its trailing punctuation, never at the digit: a digit is not
  // ASCII punctuation, so "\1." would print a literal backslash instead of the authored text
  assert.strictEqual(escapeMd("1. item one"), "1\\. item one");
  // Thematic-break runs and setext underlines stay escaped by their own rules, not the bullet rule
  assert.strictEqual(escapeMd("---"), "\\---");
  assert.strictEqual(escapeMd("Sub\n--"), "Sub\n\\--");
  // A number followed by inline content is prose, not a marker: only "." / ")" + space-or-EOL binds
  assert.strictEqual(escapeMd("v1.5 draft"), "v1.5 draft");
});

it("escapeMd only escapes what can actually build markup, leaving authored punctuation intact", () => {
  // Headings and blockquotes bind at the start of a line, so mid-sentence markers are literal text
  assert.strictEqual(escapeMd("Built with ASP.NET and C#"), "Built with ASP.NET and C#");
  assert.strictEqual(escapeMd(")> line continuation"), ")> line continuation");
  // ...while the same characters at a line start still lose their markup meaning
  assert.strictEqual(escapeMd("# heading\n> quoted"), "\\# heading\n\\> quoted");
  // An image needs "![", so a sentence-final "!" is plain punctuation
  assert.strictEqual(escapeMd("financed by the EU initiative “STOP Exclusion!”"), "financed by the EU initiative “STOP Exclusion!”");
  // "_" is literal inside a word (CommonMark's intraword rule), but emphasis still binds at a boundary
  assert.strictEqual(escapeMd("node_modules and snake_case names"), "node_modules and snake_case names");
  assert.strictEqual(escapeMd("an _emphasized_ word"), "an \\_emphasized\\_ word");
  // Strikethrough needs a run of two; a lone "~" and a pipe cannot build markup at all
  assert.strictEqual(escapeMd("roughly ~30% of the time"), "roughly ~30% of the time");
  assert.strictEqual(escapeMd("the ratio A | B mattered"), "the ratio A | B mattered");
  assert.strictEqual(escapeMd("~~deprecated~~ in favour of the new one"), "\\~\\~deprecated\\~\\~ in favour of the new one");
  // Raw HTML is the one thing an author string must never reach the document, so "<" is always escaped
  assert.strictEqual(escapeMdInline("evil </script><script>alert(1)</script>"), "evil \\</script>\\<script>alert(1)\\</script>");
});

it("escapeMdInline flattens newlines before escaping, so labels never inherit the bullet marker", () => {
  // "Design\n- Systems" would otherwise become a real list item nested inside the bullet
  assert.strictEqual(escapeMdInline("Design\n- Systems"), "Design - Systems");
  // Only the newline runs flatten: runs of spaces inside prose are content, not structure
  assert.strictEqual(escapeMdInline("  spaced   out\nvalue  "), "spaced   out value");
});

it("buildExperienceMd renders frontmatter, H1, skills and links without repeated crawler instructions", () => {
  const md = buildExperienceMd({ experience: sampleExperience, preferredLanguage: "en", translate: translateEn });
  assert.include(md, `canonical: "https://www.remiforge.dev/sample-role"`);
  // author mirrors the HTML author meta on every twin
  assert.include(md, `author: "Remi Forge"`);
  assert.include(md, `# Full-Stack Developer at Sample Co`);
  assert.include(md, `- TypeScript`);
  assert.include(md, `## Links`);
  assert.include(md, `https://github.com/example/repo`);
  assert.include(md, `lang: "en"`);
  assert.include(md, `type: "work-experience"`);
  // Discrete frontmatter facts stay queryable without parsing the title or body
  assert.include(md, `role: "Full-Stack Developer"`);
  assert.include(md, `company: "Sample Co"`);
  assert.notInclude(md, "Cite the canonical HTML URL");
  // Twins stay UI-chrome free: no navs, footers, or scripts ever reach the Markdown surface
  assert.notInclude(md.toLowerCase(), "<html");
  assert.notInclude(md.toLowerCase(), "<nav");
  assert.notInclude(md.toLowerCase(), "<footer");
  // Body prose must be escaped (frontmatter is YAML-quoted, so raw chars are fine there): the
  // inline constructors are neutralized, while markers that only bind at a line start survive
  assert.include(md, "\\*\\*care\\*\\*");
  assert.include(md, "and #hashtags.");
  // One H1 per document, flat H2 hierarchy: an AI parser reads the shape without visual context
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
  assert.isTrue((md.match(/^## /gm) ?? []).length >= 4);
  assert.strictEqual((md.match(/^### /gm) ?? []).length, 0);
});

it("experience Markdown canonical encodes a slug as one path segment", () => {
  const experience = { ...sampleExperience, slug: "résumé & more" };
  const md = buildExperienceMd({ experience, preferredLanguage: "en", translate: translateEn });
  assert.include(md, `canonical: "https://www.remiforge.dev/r%C3%A9sum%C3%A9%20%26%20more"`);
});

it("buildExperienceMd omits the Links section when the experience has no links", () => {
  const md = buildExperienceMd({ experience: { ...sampleExperience, gitHubLink: undefined }, preferredLanguage: "en", translate: translateEn });
  assert.include(md, `## Skills Used`);
  assert.notInclude(md, `## Links`);
});

it("buildExperienceMd localizes fixed Polish section and fact labels", () => {
  const md = buildExperienceMd({ experience: sampleExperience, preferredLanguage: "pl", translate: translatePl });
  assert.include(md, "## Opis");
  assert.include(md, "## Szczegóły");
  assert.include(md, "Rola: Full-Stack Developer");
  assert.include(md, "## Wykorzystane Umiejętności");
  assert.include(md, "## Linki");
});

it("experience link labels are the dictionary keys the HTML chips translate, so Polish gets Polish labels", () => {
  const everyLink = { ...sampleExperience, liveLink: "https://example.com/live", videoLink: "https://example.com/video" };

  const en = buildExperienceMd({ experience: everyLink, preferredLanguage: "en", translate: translateEn });
  assert.include(en, "[GitHub Repo](https://github.com/example/repo)");
  assert.include(en, "[Live Link](https://example.com/live)");
  assert.include(en, "[Watch Video](https://example.com/video)");

  // The previous untranslated labels must not ship: they name no dictionary key, so a Polish
  // reader would have been handed English link labels beside an otherwise translated document
  assert.notInclude(en, "[GitHub](https://github.com/example/repo)");
  const pl = buildExperienceMd({ experience: everyLink, preferredLanguage: "pl", translate: translatePl });
  assert.include(pl, "[Repozytorium GitHub](https://github.com/example/repo)");
  assert.include(pl, "[Link na Żywo](https://example.com/live)");
  assert.include(pl, "[Zobacz Video](https://example.com/video)");
});

it("buildHomeMd groups work and projects and links to .md twins", () => {
  const md = buildHomeMd({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en", translate: translateEn });
  assert.include(md, `canonical: "https://www.remiforge.dev/"`);
  assert.include(md, `title: "Remi Forge ● ${STATIC_PAGES["/"].copy.en.title}"`);
  assert.include(md, `description: "${STATIC_PAGES["/"].copy.en.description}"`);
  assert.include(md, `author: "Remi Forge"`);
  assert.include(md, `type: "overview"`);
  assert.notInclude(md, "Cite the canonical HTML URL");
  // Detail links pin the reader's language, so the advertised twin is deterministic
  assert.include(md, `https://www.remiforge.dev/sample-role.md?lang=en`);
  assert.include(md, `https://www.remiforge.dev/education.md?lang=en`);
  // The single-request ingestion document is reachable from the twin itself, not only from llms.txt
  assert.include(md, `https://www.remiforge.dev/llms-full.txt`);
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
  assert.strictEqual((md.match(/^## /gm) ?? []).length, 3);
  assert.notInclude(md, "Navigation");
  assert.notInclude(md, "Footer");
});

it("home Markdown links encode experience slugs consistently", () => {
  const experience = { ...sampleExperience, slug: "my project" };
  const md = buildHomeMd({ pageTitles: stablePageTitles, experienceList: [experience], preferredLanguage: "en", translate: translateEn });
  assert.include(md, "https://www.remiforge.dev/my%20project.md?lang=en");
});

it("buildHomeMd localizes Markdown structure in Polish", () => {
  const md = buildHomeMd({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "pl", translate: translatePl });
  assert.include(md, "## Doświadczenie");
  assert.include(md, "## Projekty do Portfolio");
  assert.include(md, "## Strony");
  assert.include(md, "[Edukacja i certyfikaty]");
  assert.include(md, "_Brak wpisów._");
  // Sibling twins follow the Polish reader, not the English default
  assert.include(md, "https://www.remiforge.dev/education.md?lang=pl");
  assert.include(md, "https://www.remiforge.dev/contact.md?lang=pl");
});

it("the education twin nests each school one level below its own section", () => {
  // A school name is a content entry, not a section of the document: rendered at level 2 it sat
  // as a peer of "Documents" and "Pages", so a reader with no visual context could not tell a
  // school's facts from the page's own structure
  const md = buildEducationMd({
    pageTitles: stablePageTitles,
    educationList: [
      { name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." },
      { name: "Second School", year: "2021", location: "Spain", info: "Studied colour." },
    ],
    preferredLanguage: "en",
    translate: translateEn,
  });

  assert.include(md, "## Education");
  assert.include(md, "### Example School");
  assert.include(md, "### Second School");
  // The heading level is the only thing that changed: the facts and prose stay in the section
  assert.include(md, "- Years: 2020");
  assert.include(md, "Studied interaction design.");
  // One H1 per document, and the school entries sit strictly below the document's own sections
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
  assert.isTrue((md.match(/^## /gm) ?? []).length >= 3); // Education, Documents, Pages
  assert.strictEqual((md.match(/^### /gm) ?? []).length, 2);

  const polish = buildEducationMd({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "pl", translate: translatePl });
  assert.include(polish, "## Edukacja");
  assert.include(polish, "_Brak wpisów._");
});

it("buildEducationMd stays localized and a missing document has no canonical", () => {
  const edu = buildEducationMd({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "pl", translate: translatePl });
  assert.include(edu, `lang: "pl"`);
  assert.include(edu, `title: "Remi Forge ● ${STATIC_PAGES["/education"].copy.pl.title}"`);
  assert.include(edu, `description: "${STATIC_PAGES["/education"].copy.pl.description}"`);
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

  const missing = buildNotFoundMd({ slug: Option.some("bogus"), preferredLanguage: "en", translate: translateEn });
  assert.include(missing, `# Not Found`);
  assert.include(missing, `https://www.remiforge.dev/index.md`);
  assert.notInclude(missing, "canonical:");

  const missingPl = buildNotFoundMd({ slug: Option.some("brak"), preferredLanguage: "pl", translate: translatePl });
  assert.include(missingPl, "# Nie znaleziono");
  assert.include(missingPl, "Dokument Markdown dla adresu /brak nie istnieje.");

  // The escape hatch is pinned to the reader's language like every other twin link, so an AI
  // fetcher that lands on a Polish 404 is sent to the Polish home twin, not a negotiated variant
  assert.include(missing, "[Home page](https://www.remiforge.dev/index.md?lang=en)");
  assert.include(missingPl, "[Strona główna](https://www.remiforge.dev/index.md?lang=pl)");
});

it("a translated document label cannot fabricate a Markdown link destination", () => {
  // The label is dictionary copy inside a link label: an unescaped "]" would close the label
  // early and hand a crawler a destination the site never published
  const hostile = (source: string): string => (source === "Certificates" ? "Evil](https://evil.test)" : source);
  const md = buildEducationMd({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en", translate: hostile });

  // The bracket is escaped, so the label stays one label and the real destination survives
  assert.include(md, "[Evil\\](https://evil.test)](https://www.remiforge.dev/my-certificates.pdf)");
  assert.notInclude(md, "[Evil](https://evil.test)");
});

it("buildContactMd advertises the same social profiles as the HTML page", () => {
  const md = buildContactMd({ pageTitles: stablePageTitles, preferredLanguage: "en", translate: translateEn });
  assert.include(md, `title: "Remi Forge ● ${STATIC_PAGES["/contact"].copy.en.title}"`);
  assert.notInclude(md, "Notes for AI systems");
  assert.include(md, `GitHub: https://github.com/remi-k-work`);
  assert.include(md, `LinkedIn: https://linkedin.com/in/remi-k-work`);

  const polish = buildContactMd({ pageTitles: stablePageTitles, preferredLanguage: "pl", translate: translatePl });
  assert.include(polish, "## Kanały");
  assert.include(polish, "Formularz Kontaktowy:");
  assert.include(polish, "Lokalizacja: Rzeszów, Polska");
});

it("every static twin links its siblings and both AI indexes (the GEO crawl graph)", () => {
  const twins = [
    buildHomeMd({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en", translate: translateEn }),
    buildEducationMd({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en", translate: translateEn }),
    buildContactMd({ pageTitles: stablePageTitles, preferredLanguage: "en", translate: translateEn }),
    buildExperienceMd({ experience: sampleExperience, preferredLanguage: "en", translate: translateEn }),
  ];

  for (const md of twins) {
    assert.include(md, `[llms.txt](https://www.remiforge.dev/llms.txt)`);
    assert.include(md, `[llms-full.txt](https://www.remiforge.dev/llms-full.txt)`);
  }

  // A static twin never advertises itself; the home twin points at the two subpages, each
  // subpage points back home, and the detail twin points at the home twin
  const home = twins[0]!;
  const education = twins[1]!;
  const contact = twins[2]!;
  const detail = twins[3]!;
  assert.notInclude(home, "index.md?lang=en");
  assert.include(education, "[Home page](https://www.remiforge.dev/index.md?lang=en)");
  assert.include(education, "[Contact](https://www.remiforge.dev/contact.md?lang=en)");
  // A twin never advertises itself
  assert.notInclude(education, "[Education & Certificates](");
  assert.include(contact, "[Home page](https://www.remiforge.dev/index.md?lang=en)");
  assert.include(contact, "[Education & Certificates](https://www.remiforge.dev/education.md?lang=en)");
  assert.include(detail, "[Home page](https://www.remiforge.dev/index.md?lang=en)");
});

it("twinIndexLinks excludes the linking page itself", () => {
  const links = twinIndexLinks(
    { path: "/", mdHref: "/index.md", preferredLanguage: "en" } as unknown as Parameters<typeof twinIndexLinks>[0],
    translateEn
  );
  assert.notInclude(links, "index.md");
  assert.include(links, "education.md?lang=en");
  assert.include(links, "contact.md?lang=en");
});

it("the twin graph enumerates the static pages from the one declaration every surface reads", () => {
  // The sibling set is derived from STATIC_PAGES — the same table the HTML head, the sitemap and
  // the twin routes walk — rather than from a second path table that has to agree by hand. A page
  // declared there is picked up by the graph, and a page that never was cannot appear in it.
  const copyOf = (path: PagePath): StaticPageCopy => ({
    path,
    mdHref: STATIC_PAGES[path].mdHref,
    type: STATIC_PAGES[path].type,
    pageName: "Page",
    description: "Summary.",
    seoTitle: "Title",
    intro: "Intro.",
    canonical: `https://www.remiforge.dev${path}`,
    preferredLanguage: "en",
  });

  const staticPaths = Object.keys(STATIC_PAGES) as ReadonlyArray<PagePath>;

  for (const path of staticPaths) {
    const links = twinIndexLinks(copyOf(path), translateEn);
    // Every other static page plus the two AI indexes — nothing else, exactly once
    assert.strictEqual((links.match(/^- \[/gm) ?? []).length, staticPaths.length - 1 + AI_INDEX_MARKDOWN_LINKS.length);
    // The two indexes are exactly the advertised links, not a longer or shorter list
    for (const index of AI_INDEX_MARKDOWN_LINKS) assert.include(links, `- ${index}`);
    // No twin advertises itself, in any location
    assert.notInclude(links, `${STATIC_PAGES[path].mdHref}?lang=en`);
    // Every sibling is pinned to the reader's own language, not a negotiated variant
    for (const sibling of staticPaths.filter((other) => other !== path)) {
      assert.include(links, `${STATIC_PAGES[sibling].mdHref}?lang=en`);
    }
  }
});

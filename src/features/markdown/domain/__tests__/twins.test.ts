import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { buildContactMd, buildEducationMd, buildHomeMd, unavailableMarkdownBody } from "../twins";
import { twinDocument } from "../format";
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import type { PagePath, PageTitles, PreferredLanguage, Translate } from "@/domain/models";
import type { Experience, ExperienceList } from "@/features/experience/domain/models";

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
  "GitHub Repo": "Repozytorium GitHub",
  "Live Link": "Link na Żywo",
  "Watch Video": "Zobacz Video",
};

const translatePl = (source: string): string => polishTranslations[source] ?? source;

const homeTwin = (input: { readonly pageTitles: PageTitles; readonly experienceList: ExperienceList; readonly preferredLanguage: PreferredLanguage; readonly translate: Translate }) =>
  twinDocument(buildHomeMd(input));

const educationTwin = (input: { readonly pageTitles: PageTitles; readonly educationList: ReadonlyArray<{ readonly name: string; readonly year: string; readonly location: string; readonly info: string }>; readonly preferredLanguage: PreferredLanguage; readonly translate: Translate }) =>
  twinDocument(buildEducationMd(input));

const contactTwin = (input: { readonly pageTitles: PageTitles; readonly preferredLanguage: PreferredLanguage; readonly translate: Translate }) =>
  twinDocument(buildContactMd(input));

it("buildHomeMd groups work and projects and links to .md twins", () => {
  const md = homeTwin({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en", translate: translateEn });
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

it("the home twin's two experience listings are one split: every experience exactly once", () => {
  // Both listings are rendered from one partition, so the document advertises every experience in
  // the list exactly once, under the kind it belongs to, in catalogue order. Splitting per section
  // instead is how a listing could drop an entry, repeat one, or file it under the wrong kind
  // without the other section being able to notice.
  const experienceList: ExperienceList = [
    { type: "e", slug: "job-a", year: "2024", role: "Dev", company: "Co", txt: "Work.", skillsUsed: ["TypeScript"], imageName: "" },
    { type: "p", slug: "project-b", year: "2025", role: "Art", company: "Co", txt: "Play.", skillsUsed: ["React"], imageName: "" },
    { type: "p", slug: "project-c", year: "2026", role: "Song", company: "Co", txt: "Sang.", skillsUsed: ["Effect"], imageName: "" },
  ];
  const md = homeTwin({ pageTitles: stablePageTitles, experienceList, preferredLanguage: "en", translate: translateEn });

  const sectionOf = (title: string) => md.split(`## ${title}\n`)[1]?.split("\n## ")[0] ?? "";
  const employment = sectionOf("Experience");
  const projects = sectionOf("Portfolio Projects");

  for (const { slug, type } of experienceList) {
    const twin = `](${`https://www.remiforge.dev/${slug}.md?lang=en`})`;
    const own = type === "e" ? employment : projects;
    const other = type === "e" ? projects : employment;

    assert.include(own, twin, `${slug} is listed under its own kind`);
    assert.notInclude(other, twin, `${slug} is not filed under the other kind`);
    // Exactly once in the whole document: the sibling index and the escape links never repeat it
    assert.strictEqual(md.split(twin).length - 1, 1, `${slug} is advertised exactly once`);
  }

  // And nothing else: the two listings publish the whole list, so no section grew a third kind
  const listed = [...employment.matchAll(/]\((https:\/\/[^)]+)\)/g), ...projects.matchAll(/]\((https:\/\/[^)]+)\)/g)].map(([, href]) => href);
  assert.deepStrictEqual(
    listed,
    experienceList.map(({ slug }) => `https://www.remiforge.dev/${slug}.md?lang=en`)
  );
});

it("home Markdown links encode experience slugs consistently", () => {
  const experience = { ...sampleExperience, slug: "my project" };
  const md = homeTwin({ pageTitles: stablePageTitles, experienceList: [experience], preferredLanguage: "en", translate: translateEn });
  assert.include(md, "https://www.remiforge.dev/my%20project.md?lang=en");
});

it("buildHomeMd localizes Markdown structure in Polish", () => {
  const md = homeTwin({ pageTitles: stablePageTitles, experienceList: [], preferredLanguage: "pl", translate: translatePl });
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
  const md = educationTwin({
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

  const polish = educationTwin({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "pl", translate: translatePl });
  assert.include(polish, "## Edukacja");
  assert.include(polish, "_Brak wpisów._");
});

it("the education twin stays localized and a missing document has no canonical", () => {
  const edu = educationTwin({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "pl", translate: translatePl });
  assert.include(edu, `lang: "pl"`);
  assert.include(edu, `title: "Remi Forge ● ${STATIC_PAGES["/education"].copy.pl.title}"`);
  assert.include(edu, `description: "${STATIC_PAGES["/education"].copy.pl.description}"`);
  assert.include(edu, "## Dokumenty");
  assert.include(edu, "_Brak wpisów._");

  const populated = educationTwin({
    pageTitles: stablePageTitles,
    educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }],
    preferredLanguage: "pl",
    translate: translatePl,
  });
  assert.include(populated, "Lata: 2020");
  assert.include(populated, "Lokalizacja: Poland");

  const missing = twinDocument(buildContactMd({ pageTitles: stablePageTitles, preferredLanguage: "en", translate: translateEn }));
  assert.include(missing, `title: "Remi Forge ● ${STATIC_PAGES["/contact"].copy.en.title}"`);

  const missingPl = twinDocument(buildContactMd({ pageTitles: stablePageTitles, preferredLanguage: "pl", translate: translatePl }));
  assert.include(missingPl, "## Kanały");
  assert.include(missingPl, "Formularz Kontaktowy:");
  assert.include(missingPl, "Lokalizacja: Rzeszów, Polska");
});

it("a translated document label cannot fabricate a Markdown link destination", () => {
  // The label is dictionary copy inside a link label: an unescaped "]" would close the label
  // early and hand a crawler a destination the site never published
  const hostile = (source: string): string => (source === "Certificates" ? "Evil](https://evil.test)" : source);
  const md = educationTwin({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en", translate: hostile });

  // The bracket is escaped, so the label stays one label and the real destination survives
  assert.include(md, "[Evil\\](https://evil.test)](https://www.remiforge.dev/my-certificates.pdf)");
  assert.notInclude(md, "[Evil](https://evil.test)");
});

it("the contact twin advertises the same social profiles as the HTML page", () => {
  const md = contactTwin({ pageTitles: stablePageTitles, preferredLanguage: "en", translate: translateEn });
  assert.include(md, `title: "Remi Forge ● ${STATIC_PAGES["/contact"].copy.en.title}"`);
  assert.notInclude(md, "Notes for AI systems");
  // The Channels line names the contact page's canonical — the same URL the contact <head>
  // publishes — read from the copy the shared frame resolved rather than derived a second time
  assert.include(md, "Contact Form: https://www.remiforge.dev/contact (same page in HTML)");
  assert.include(md, `GitHub: https://github.com/remi-k-work`);
  assert.include(md, `LinkedIn: https://linkedin.com/in/remi-k-work`);
  // The base location is one authored string routed through the dictionary, so the English twin and
  // the AI index's "Based in" fact state the same constant and a Polish reader gets its own spelling
  assert.include(md, "- Base: Rzeszów, Poland");

  const polish = contactTwin({ pageTitles: stablePageTitles, preferredLanguage: "pl", translate: translatePl });
  assert.include(polish, "## Kanały");
  assert.include(polish, "Formularz Kontaktowy:");
  assert.include(polish, "Lokalizacja: Rzeszów, Polska");
});

it("every static twin links its siblings and both AI indexes (the GEO crawl graph)", () => {
  const twins = [
    homeTwin({ pageTitles: stablePageTitles, experienceList: [sampleExperience], preferredLanguage: "en", translate: translateEn }),
    educationTwin({ pageTitles: stablePageTitles, educationList: [], preferredLanguage: "en", translate: translateEn }),
    contactTwin({ pageTitles: stablePageTitles, preferredLanguage: "en", translate: translateEn }),
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
  assert.notInclude(home, "index.md?lang=en");
  assert.include(education, "[Home page](https://www.remiforge.dev/index.md?lang=en)");
  assert.include(education, "[Contact](https://www.remiforge.dev/contact.md?lang=en)");
  // A twin never advertises itself
  assert.notInclude(education, "[Education \\& Certificates](");
  assert.include(contact, "[Home page](https://www.remiforge.dev/index.md?lang=en)");
  assert.include(contact, "[Education \\& Certificates](https://www.remiforge.dev/education.md?lang=en)");
});

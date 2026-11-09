import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { CONTACT_TWIN, EDUCATION_TWIN, HOME_TWIN, PAGE_TWINS, PAGE_ENTRIES, SOURCE_COPY } from "../constants";
import { allEntries } from "../helpers";
import { twinDocument } from "../format";
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { absoluteUrl, markdownTwinUrl } from "@/features/meta/domain/urls";
import { experienceSeo } from "@/features/meta/domain/helpers";
import { Datasets } from "@/features/data/services/datasets";
import type { ExperienceList } from "@/features/experience/domain/models";

it("the catalogue declares every static page twin exactly once", () => {
  assert.deepStrictEqual(
    Array.from(PAGE_TWINS, (twin) => twin.pagePath),
    ["/", "/education", "/contact"]
  );

  // Verifies consistency with the shared static pages dictionary.
  for (const twin of PAGE_TWINS) {
    assert.strictEqual(twin.name, STATIC_PAGES[twin.pagePath].label, `${twin.pagePath} name`);
    assert.strictEqual(twin.mdHref, STATIC_PAGES[twin.pagePath].mdHref, `${twin.pagePath} twin route`);
    assert.strictEqual(twin.canonical, absoluteUrl(twin.pagePath), `${twin.pagePath} canonical`);
  }

  assert.deepStrictEqual(new Set(PAGE_TWINS), new Set([HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN]));
});

it("page entries advertise the canonical HTML URL and a language-pinned twin for every twin", () => {
  const entries = PAGE_ENTRIES;

  assert.strictEqual(entries.length, PAGE_TWINS.length);
  for (const entry of entries) {
    assert.isFalse(entry.canonical.includes(".md"), `canonical advertised a twin: ${entry.canonical}`);
    assert.include(entry.twinUrl, "?lang=en");
    assert.include(entry.twinUrl, ".md");
    assert.isString(entry.summary);
  }
});

it("the contact twin still renders: a body that reads no portfolio dataset is not an empty document", () => {
  const md = twinDocument(
    CONTACT_TWIN.render(
      {
        pageTitles: {
          "/": { eyebrow: "", heading: "Home", intro: "" },
          "/education": { eyebrow: "", heading: "Ed", intro: "" },
          "/contact": { eyebrow: "", heading: "Kontakt", intro: "" },
        },
      },
      SOURCE_COPY
    )
  );

  assert.include(md, `title: "Remi Forge ● Contact"`);
  assert.include(md, "## Channels");
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
});

it.effect("each static twin resolves only the datasets its body declares", () =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;

    const home = yield* HOME_TWIN.resolveData(datasets, "en");
    assert.deepStrictEqual(Object.keys(home), ["pageTitles", "experienceList"]);

    const education = yield* EDUCATION_TWIN.resolveData(datasets, "en");
    assert.deepStrictEqual(Object.keys(education), ["pageTitles", "educationList"]);

    // Contact twin only loads page titles, skipping unused datasets.
    const contact = yield* CONTACT_TWIN.resolveData(datasets, "en");
    assert.deepStrictEqual(Object.keys(contact), ["pageTitles"]);
  }).pipe(Effect.provide(Datasets.layer))
);

it("allEntries concatenates the page twins and then every detail twin in portfolio order", () => {
  const experienceList: ExperienceList = [
    { type: "e", slug: "job", year: "2024", role: "Dev", company: "Co", txt: "Work.", skillsUsed: ["TypeScript"], imageName: "" },
    { type: "p", slug: "project", year: "2025", role: "Art", company: "Co", txt: "Play.", skillsUsed: ["React"], imageName: "" },
  ];

  const entries = allEntries(experienceList);

  assert.strictEqual(entries.length, PAGE_TWINS.length + experienceList.length);
  assert.strictEqual(entries[0]?.canonical, "https://www.remiforge.dev/");
  assert.deepStrictEqual(
    entries.slice(PAGE_TWINS.length).map((entry) => entry.canonical),
    ["https://www.remiforge.dev/job", "https://www.remiforge.dev/project"]
  );

  for (const experience of experienceList) {
    const seo = experienceSeo({ experience, preferredLanguage: "en" });
    const entry = entries.find(({ canonical }) => canonical === seo.canonical);

    assert.strictEqual(entry?.name, seo.headline, `${experience.slug} headline`);
    assert.strictEqual(entry?.twinUrl, markdownTwinUrl(seo.markdownPath, "en"), `${experience.slug} twin URL`);
  }
});

// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { CONTACT_TWIN, EDUCATION_TWIN, HOME_TWIN, PAGE_TWINS, PAGE_ENTRIES, allEntries } from "../catalogue";
import { SOURCE_COPY } from "../copy";
import { twinDocument } from "../format";

// meta (shared)
import { STATIC_PAGES } from "@/features/meta/domain/pages";
import { absoluteUrl, markdownTwinUrl } from "@/features/meta/domain/urls";
import { experienceSeo } from "@/features/meta/domain/experience-seo";
import { Datasets } from "@/features/data/services/datasets";

// types
import type { ExperienceList } from "@/features/experience/domain/models";

// The catalogue is the single declaration of the page twins, so the invariant that matters is
// that every surface reads the same record: the route serves what the index advertises.

it("the catalogue declares every static page twin exactly once", () => {
  // Three twins, in the order the indexes lead with (homepage first)
  assert.deepStrictEqual(
    Array.from(PAGE_TWINS, (twin) => twin.pagePath),
    ["/", "/education", "/contact"]
  );

  // Each twin's display name, route, canonical and twin path come from the shared page catalogue,
  // so the twin, its index entry and the twin graph cannot describe the page a second way
  for (const twin of PAGE_TWINS) {
    assert.strictEqual(twin.name, STATIC_PAGES[twin.pagePath].label, `${twin.pagePath} name`);
    assert.strictEqual(twin.mdHref, STATIC_PAGES[twin.pagePath].mdHref, `${twin.pagePath} twin route`);
    assert.strictEqual(twin.canonical, absoluteUrl(twin.pagePath), `${twin.pagePath} canonical`);
  }

  // The named twins and the walked list are the same three declarations, not two tables
  assert.deepStrictEqual(new Set(PAGE_TWINS), new Set([HOME_TWIN, EDUCATION_TWIN, CONTACT_TWIN]));
});

it("page entries advertise the canonical HTML URL and a language-pinned twin for every twin", () => {
  // The projection is a module constant: three static site facts built once, not per request
  const entries = PAGE_ENTRIES;

  assert.strictEqual(entries.length, PAGE_TWINS.length);
  for (const entry of entries) {
    // The citation target is the clean HTML canonical, never the .md route
    assert.isFalse(entry.canonical.includes(".md"), `canonical advertised a twin: ${entry.canonical}`);
    // The advertised twin is pinned, so a fetcher lands on the document the entry describes
    assert.include(entry.twinUrl, "?lang=en");
    assert.include(entry.twinUrl, ".md");
    // A summary is one authored sentence, not a second statement ending mid-word
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

// The resolver is part of the twin's declaration, so the bundle a render reads and the bundle the
// route resolves are one record: a dataset added to one side cannot go missing from the other.
it.effect("each static twin resolves only the datasets its body declares", () =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;

    const home = yield* HOME_TWIN.resolveData(datasets, "en");
    assert.deepStrictEqual(Object.keys(home), ["pageTitles", "experienceList"]);

    const education = yield* EDUCATION_TWIN.resolveData(datasets, "en");
    assert.deepStrictEqual(Object.keys(education), ["pageTitles", "educationList"]);

    // The contact twin reads no portfolio data, so it resolves only the titles its heading needs
    // rather than the two lists it would discard
    const contact = yield* CONTACT_TWIN.resolveData(datasets, "en");
    assert.deepStrictEqual(Object.keys(contact), ["pageTitles"]);
  }).pipe(Effect.provide(Datasets.layer))
);

it("allEntries concatenates the page twins and then every detail twin in portfolio order", () => {
  // Annotated so the non-empty `skillsUsed` tuples are inferred from ExperienceList rather than
  // widening to `string[]`
  const experienceList: ExperienceList = [
    { type: "e", slug: "job", year: "2024", role: "Dev", company: "Co", txt: "Work.", skillsUsed: ["TypeScript"], imageName: "" },
    { type: "p", slug: "project", year: "2025", role: "Art", company: "Co", txt: "Play.", skillsUsed: ["React"], imageName: "" },
  ];

  const entries = allEntries(experienceList);

  assert.strictEqual(entries.length, PAGE_TWINS.length + experienceList.length);
  assert.strictEqual(entries[0]?.canonical, "https://www.remiforge.dev/");
  // Detail entries keep portfolio order, so an index reads the same order the slider shows
  assert.deepStrictEqual(
    entries.slice(PAGE_TWINS.length).map((entry) => entry.canonical),
    ["https://www.remiforge.dev/job", "https://www.remiforge.dev/project"]
  );

  // Every detail entry restates the SEO record its page publishes — headline, canonical and
  // language-pinned twin — so the index can never advertise an address the page itself denies
  for (const experience of experienceList) {
    const seo = experienceSeo({ experience, preferredLanguage: "en" });
    const entry = entries.find(({ canonical }) => canonical === seo.canonical);

    assert.strictEqual(entry?.name, seo.headline, `${experience.slug} headline`);
    assert.strictEqual(entry?.twinUrl, markdownTwinUrl(seo.markdownPath, "en"), `${experience.slug} twin URL`);
  }
});

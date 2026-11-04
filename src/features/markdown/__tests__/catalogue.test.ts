// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { Datasets } from "@/features/data/services/datasets";
import { CONTACT_TWIN, EDUCATION_TWIN, HOME_TWIN, PAGE_TWINS, PAGE_ENTRIES, allEntries, SOURCE_COPY } from "../domain/twins";

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

  // The route each service key names is the same declaration the indexes walk, so a twin's
  // route and its advertisement cannot drift apart
  assert.strictEqual(HOME_TWIN.name, "Home");
  assert.strictEqual(EDUCATION_TWIN.name, "Education & Certificates");
  assert.strictEqual(CONTACT_TWIN.name, "Contact");
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

it("the contact twin resolves no dataset, so an unrelated asset failure cannot 503 it", () => {
  // Its resolver is the constant empty record: no Data requirement reaches the layer, and the
  // rendered body is complete without ever reading a portfolio asset.
  const resolved = CONTACT_TWIN.resolve({} as Parameters<typeof CONTACT_TWIN.resolve>[0], "en");
  assert.deepStrictEqual(Effect.runSync(resolved), {});
});

it.effect("each page twin's resolver returns exactly the dataset its body declares", () =>
  Effect.gen(function* () {
    const datasets = yield* Datasets;

    // One key for the home twin, and it is the one the home body renders from
    const home = yield* HOME_TWIN.resolve(datasets, "en");
    assert.deepStrictEqual(Object.keys(home), ["experienceList"]);

    // The education twin keys off the school list instead, so a portfolio failure never reaches it
    const education = yield* EDUCATION_TWIN.resolve(datasets, "en");
    assert.deepStrictEqual(Object.keys(education), ["educationList"]);

    // The contact twin resolves nothing at all
    assert.deepStrictEqual(yield* CONTACT_TWIN.resolve(datasets, "en"), {});
  }).pipe(Effect.provide(Datasets.layer))
);

it("the contact twin still renders: a dataset-free body is not an empty document", () => {
  const md = CONTACT_TWIN.render(
    { "/": { eyebrow: "", heading: "Home", intro: "" }, "/education": { eyebrow: "", heading: "Ed", intro: "" }, "/contact": { eyebrow: "", heading: "Kontakt", intro: "" } },
    {},
    SOURCE_COPY
  );

  assert.include(md, `title: "Remi Forge ● Contact"`);
  assert.include(md, "## Channels");
  assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
});

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
});

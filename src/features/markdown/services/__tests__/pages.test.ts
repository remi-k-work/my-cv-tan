import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { PAGE_TWINS } from "../pages";
import { pageEntry } from "../../domain/catalogue";
import { twinDocument } from "../../domain/format";
import { Datasets } from "@/features/data/services/datasets";
import { RequiredDataError } from "@/features/data/domain/required";
import { STATIC_PAGES, STATIC_PAGE_PATHS } from "@/domain/pages";
import { CONTACT_PATH, EDUCATION_PATH, HOME_PATH } from "@/domain/constants";
import { sampleEmployment, translateEn } from "@/testing/fixtures";

const failed = (dataset: string): Effect.Effect<never, RequiredDataError> =>
  Effect.fail(new RequiredDataError({ dataset, message: `test forbids reading ${dataset}` }));

const datasets = (available: { readonly experienceList?: boolean; readonly educationList?: boolean }): Datasets["Service"] => ({
  experienceList: available.experienceList ? () => Effect.succeed([sampleEmployment]) : () => failed("experience list"),
  educationList: available.educationList ? () => Effect.succeed([]) : () => failed("education list"),
});

const context = { preferredLanguage: "en", translate: translateEn } as const;

it("the page twin record is exhaustive over the page catalogue", () => {
  assert.deepStrictEqual(Object.keys(PAGE_TWINS).sort(), [...STATIC_PAGE_PATHS].sort());

  for (const path of STATIC_PAGE_PATHS) {
    assert.deepStrictEqual(PAGE_TWINS[path].entry, pageEntry(path), `${path} entry`);
    assert.strictEqual(PAGE_TWINS[path].entry.mdHref, STATIC_PAGES[path].mdHref, `${path} twin route`);
  }
});

it.effect("the contact twin still renders: a body that reads no portfolio dataset is not an empty document", () =>
  Effect.gen(function* () {
    const twin = yield* PAGE_TWINS[CONTACT_PATH].document(datasets({}), context);
    const md = twinDocument(twin);

    assert.include(md, `title: "Remi Forge ● Contact"`);
    assert.include(md, "## Channels");
    assert.strictEqual((md.match(/^# /gm) ?? []).length, 1);
  })
);

it.effect("each page twin reads only the datasets its document declares", () =>
  Effect.gen(function* () {
    // The unused accessors fail on read, so a page that quietly widened its data requirements
    // would fail the test instead of merely fetching more than it needs.
    const home = yield* PAGE_TWINS[HOME_PATH].document(datasets({ experienceList: true }), context);
    assert.include(home.body, STATIC_PAGES[HOME_PATH].copy.en.heading);

    const education = yield* PAGE_TWINS[EDUCATION_PATH].document(datasets({ educationList: true }), context);
    assert.include(education.body, STATIC_PAGES[EDUCATION_PATH].copy.en.heading);

    const contact = yield* PAGE_TWINS[CONTACT_PATH].document(datasets({}), context);
    assert.include(contact.body, STATIC_PAGES[CONTACT_PATH].copy.en.heading);
  })
);

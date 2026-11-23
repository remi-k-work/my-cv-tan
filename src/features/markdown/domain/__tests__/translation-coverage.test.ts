// The regression guard for the bug class this feature hit: a Markdown twin resolved copy through
// translate(), but the source was never registered with msg(), so gt generate never extracted it
// and the document silently fell back to English. Every builder that reads a language context is
// exercised with a recording translate, and every source it asks for must exist in the committed
// dictionaries.

import { assert, it } from "@effect/vitest";
import { Option } from "effect";
import { loadTranslations } from "@/lib/gt-translations";
import { experienceSeo } from "@/features/meta/domain/seo";
import { buildExperienceMd } from "../detail-twin";
import { buildNotFoundMd, unavailableMarkdownBody } from "../fallback";
import { buildContactMd, buildEducationMd, buildHomeMd } from "../twins";
import { sampleExperience, stablePageTitles } from "@/features/markdown/__tests__/fixtures";

// types
import type { Translate } from "@/domain/models";

// Collects every source a builder asks to translate, then hands the source back unchanged so the
// builders still assemble a document
const requested = new Set<string>();
const record: Translate = (source) => {
  requested.add(source);
  return source;
};

const context = { preferredLanguage: "pl", translate: record } as const;

// Each builder runs for both arms of every emptiness match, so the fallback copy is requested too
buildHomeMd({ ...context, pageTitles: stablePageTitles, experienceList: [sampleExperience] });
buildHomeMd({ ...context, pageTitles: stablePageTitles, experienceList: [] });
buildEducationMd({ ...context, pageTitles: stablePageTitles, educationList: [{ name: "Example School", year: "2020", location: "Poland", info: "Studied interaction design." }] });
buildEducationMd({ ...context, pageTitles: stablePageTitles, educationList: [] });
buildContactMd({ ...context, pageTitles: stablePageTitles });
buildExperienceMd({ seo: experienceSeo({ experience: sampleExperience, preferredLanguage: "pl" }), translate: record });
buildNotFoundMd({ ...context, slug: Option.some(sampleExperience.slug) });
buildNotFoundMd({ ...context, slug: Option.none() });
unavailableMarkdownBody(record);

it("every source a Markdown twin requests is extracted and translated", async () => {
  const en = await loadTranslations("en");
  const pl = await loadTranslations("pl");

  // Guard the wiring itself: a builder silently dropping out of this test would otherwise pass
  // vacuously, so a sentinel from each builder family must have been requested
  for (const sentinel of ["Pages", "No entries.", "Rzeszów, Poland", "Content temporarily unavailable"]) {
    assert.isTrue(requested.has(sentinel), `"${sentinel}" was not requested; a builder stopped being exercised`);
  }

  // The dictionary is keyed by hash, so invert it to look a source up by the copy it was written as
  const hashBySource = new Map(Object.entries(en).map(([hash, source]) => [source, hash]));
  // Two entries sharing one source string would make the inverse ambiguous; no twin does today
  assert.strictEqual(hashBySource.size, Object.keys(en).length);

  for (const source of requested) {
    const hash = hashBySource.get(source);
    assert.isDefined(hash, `"${source}" was never registered with msg(), so gt generate pruned it`);
    assert.notStrictEqual(pl[hash!], en[hash!], `"${source}" has no Polish translation`);
  }
});

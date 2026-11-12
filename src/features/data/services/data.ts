// services, features, and other libraries
import { Array, Context, Effect, Layer, Option, Random, Schema } from "effect";
import { haveSameExperienceSlugs } from "@/features/experience/domain/helpers";
import { ExperienceList } from "@/features/experience/domain/models";
import { EducationList } from "@/features/education/domain/models";
import { PageTitlesList } from "@/domain/models";
import { requestPreferredLanguage } from "./request-language";

// assets
import pageTitlesEn from "@/assets/data/en/page-titles.json";
import pageTitlesPl from "@/assets/data/pl/page-titles.json";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";
import educationEn from "@/assets/data/en/education.json";
import educationPl from "@/assets/data/pl/education.json";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { Experience } from "@/features/experience/domain/models";

// A decoded JSON asset in both supported languages; keeping the variants in one value means a
// call site selects the bundle, never an (en, pl) pair, so the two languages can't be swapped
type LocalizedAsset<A> = Record<PreferredLanguage, Option.Option<A>>;

// Canonical routes are shared across locales, so a pair that decodes but names different paths
// cannot be served safely: neither locale is published, because one language would 404 on a route
// the other publishes. A bundle that never decoded leaves the pair as it was instead — the reader
// of a language whose own bundle failed never addresses the other locale's routes, so partial data
// still serves the locale that has it. Exported so the invariant is unit-testable rather than
// only observable through a decode of the real assets.
export const localizedExperienceAsset = <A extends ReadonlyArray<Pick<Experience, "slug">>>(
  english: Option.Option<A>,
  polish: Option.Option<A>
): LocalizedAsset<A> => {
  // Both bundles decoded but disagree on the routes they publish, so neither can be served
  if (Option.isSome(english) && Option.isSome(polish) && !haveSameExperienceSlugs(english.value, polish.value))
    return { en: Option.none<A>(), pl: Option.none<A>() };

  return { en: english, pl: polish };
};

// The decoders are pure values, so they are built once at module scope and reused on every layer
// construction — the same "build once, use many" the captcha session's sealed-value decoder follows.
// `decodeOption` keeps compile-time checking where the imported JSON already matches the schema's
// encoded type; the experience assets mix "e" and "p" entries, which widen to `string` on import,
// so they need the decoder that accepts unknown input
const decodePageTitlesList = Schema.decodeOption(PageTitlesList);
const decodeExperienceList = Schema.decodeUnknownOption(ExperienceList);
const decodeEducationList = Schema.decodeOption(EducationList);

export class Data extends Context.Service<Data>()("Data", {
  make: Effect.sync(() => {
    // Decode once at service construction. Decoding to Option turns a malformed asset into None
    // (missing data downstream) instead of failing the layer
    const pageTitlesAsset = {
      en: decodePageTitlesList(pageTitlesEn),
      pl: decodePageTitlesList(pageTitlesPl),
    };
    const decodedExperienceAsset = {
      en: decodeExperienceList(experienceEn),
      pl: decodeExperienceList(experiencePl),
    };
    // Canonical routes are shared across locales, so a mismatched slug set cannot be served safely
    const experienceAsset = localizedExperienceAsset(decodedExperienceAsset.en, decodedExperienceAsset.pl);
    const educationAsset = {
      en: decodeEducationList(educationEn),
      pl: decodeEducationList(educationPl),
    };

    const localized = <A>(preferredLanguage: Option.Option<PreferredLanguage>, asset: LocalizedAsset<A>) => asset[requestPreferredLanguage(preferredLanguage)];

    const randomPageTitles = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Option.match(localized(preferredLanguage, pageTitlesAsset), {
        onNone: () => Effect.succeedNone,
        onSome: (pageTitles) => Effect.option(Random.choice(pageTitles)),
      });

    const stablePageTitles = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.succeed(Option.flatMap(localized(preferredLanguage, pageTitlesAsset), Array.head));
    const experienceList = (preferredLanguage: Option.Option<PreferredLanguage>) => Effect.succeed(localized(preferredLanguage, experienceAsset));
    const educationList = (preferredLanguage: Option.Option<PreferredLanguage>) => Effect.succeed(localized(preferredLanguage, educationAsset));

    const experience = (slug: Experience["slug"], preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.succeed(
        Option.flatMap(
          localized(preferredLanguage, experienceAsset),
          Array.findFirst((exp) => exp.slug === slug)
        )
      );

    return { randomPageTitles, stablePageTitles, experienceList, educationList, experience } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

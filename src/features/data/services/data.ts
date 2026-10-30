// services, features, and other libraries
import { Array, Context, Effect, Layer, Option, Random, Schema } from "effect";
import { ExperienceList } from "@/features/experience/domain/models";
import { EducationList } from "@/features/education/domain/models";
import { PageTitlesList } from "@/domain/models";
import { requestPreferredLanguage } from "@/features/data/domain/helpers";

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

export class Data extends Context.Service<Data>()("Data", {
  make: Effect.sync(() => {
    // Decode localized JSON assets once at service construction; decoding to Option turns
    // malformed assets into None (treated as missing data downstream) instead of failing
    // the layer; `decodeOption` keeps compile-time checking where the imported JSON already
    // matches the schema's encoded type; the experience assets mix "e" and "p" entries, which
    // widen to `string` on import, so they need the untyped decoder
    const pageTitlesAsset = {
      en: Schema.decodeOption(PageTitlesList)(pageTitlesEn),
      pl: Schema.decodeOption(PageTitlesList)(pageTitlesPl),
    };
    const experienceAsset = {
      en: Schema.decodeUnknownOption(ExperienceList)(experienceEn),
      pl: Schema.decodeUnknownOption(ExperienceList)(experiencePl),
    };
    const educationAsset = {
      en: Schema.decodeOption(EducationList)(educationEn),
      pl: Schema.decodeOption(EducationList)(educationPl),
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

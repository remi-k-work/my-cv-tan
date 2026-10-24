// services, features, and other libraries
import { Array, Context, Effect, Layer, Option, Random, Schema } from "effect";
import { ExperienceList } from "@/features/experience/domain/models";
import { EducationList } from "@/features/education/domain/models";
import { matchPreferredLanguage } from "@/domain/helpers";
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

const pageTitlesEnData = Schema.decodeOption(PageTitlesList)(pageTitlesEn);
const pageTitlesPlData = Schema.decodeOption(PageTitlesList)(pageTitlesPl);
const experienceEnData = Schema.decodeUnknownOption(ExperienceList)(experienceEn);
const experiencePlData = Schema.decodeUnknownOption(ExperienceList)(experiencePl);
const educationEnData = Schema.decodeOption(EducationList)(educationEn);
const educationPlData = Schema.decodeOption(EducationList)(educationPl);

export class Data extends Context.Service<Data>()("Data", {
  make: Effect.sync(() => {
    const localized = <A>(preferredLanguage: Option.Option<PreferredLanguage>, en: Option.Option<A>, pl: Option.Option<A>) =>
      matchPreferredLanguage(requestPreferredLanguage(preferredLanguage), en, pl);

    const randomPageTitles = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Option.match(localized(preferredLanguage, pageTitlesEnData, pageTitlesPlData), {
        onNone: () => Effect.succeedNone,
        onSome: (pageTitles) => Effect.option(Random.choice(pageTitles)),
      });

    const stablePageTitles = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => Option.flatMap(localized(preferredLanguage, pageTitlesEnData, pageTitlesPlData), Array.head));

    const experienceList = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => localized(preferredLanguage, experienceEnData, experiencePlData));

    const educationList = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => localized(preferredLanguage, educationEnData, educationPlData));

    const experience = (slug: Experience["slug"], preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() =>
        Option.flatMap(
          localized(preferredLanguage, experienceEnData, experiencePlData),
          Array.findFirst((exp) => exp.slug === slug)
        )
      );

    return { randomPageTitles, stablePageTitles, experienceList, educationList, experience } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

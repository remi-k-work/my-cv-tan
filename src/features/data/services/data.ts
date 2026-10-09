// services, features, and other libraries
import { Array, Context, Effect, Layer, Option, Random, Schema } from "effect";
import { ExperienceList } from "@/features/experience/domain";
import { EducationList } from "@/features/education/domain";
import { matchPreferredLanguage, PageTitlesList } from "@/domain";
import { requestPreferredLanguage } from "@/features/data/domain";

// assets
import pageTitlesEn from "@/assets/data/en/page-titles.json";
import pageTitlesPl from "@/assets/data/pl/page-titles.json";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";
import educationEn from "@/assets/data/en/education.json";
import educationPl from "@/assets/data/pl/education.json";

// types
import type { PreferredLanguage } from "@/domain";
import type { Experience } from "@/features/experience/domain";

const pageTitlesEnData = Schema.decodeOption(PageTitlesList)(pageTitlesEn);
const pageTitlesPlData = Schema.decodeOption(PageTitlesList)(pageTitlesPl);
const experienceEnData = Schema.decodeUnknownOption(ExperienceList)(experienceEn);
const experiencePlData = Schema.decodeUnknownOption(ExperienceList)(experiencePl);
const educationEnData = Schema.decodeOption(EducationList)(educationEn);
const educationPlData = Schema.decodeOption(EducationList)(educationPl);

export class Data extends Context.Service<Data>()("Data", {
  make: Effect.sync(() => {
    const randomPageTitles = Effect.fn("randomPageTitles")(function* (preferredLanguage: Option.Option<PreferredLanguage>) {
      const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
      const pageTitles = matchPreferredLanguage(resolvedLanguage, pageTitlesEnData, pageTitlesPlData);
      if (Option.isNone(pageTitles)) return Option.none();
      return yield* Effect.option(Random.choice(pageTitles.value));
    });

    const stablePageTitles = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
        return Option.flatMap(matchPreferredLanguage(resolvedLanguage, pageTitlesEnData, pageTitlesPlData), Array.head);
      });

    const experienceList = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
        return matchPreferredLanguage(resolvedLanguage, experienceEnData, experiencePlData);
      });

    const educationList = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
        return matchPreferredLanguage(resolvedLanguage, educationEnData, educationPlData);
      });

    const experience = (slug: Experience["slug"], preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
        return Option.flatMap(matchPreferredLanguage(resolvedLanguage, experienceEnData, experiencePlData), Array.findFirst((exp) => exp.slug === slug));
      });

    return { randomPageTitles, stablePageTitles, experienceList, educationList, experience } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

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

export class Data extends Context.Service<Data>()("Data", {
  make: Effect.sync(() => {
    const randomPageTitles = Effect.fn("randomPageTitles")(function* (preferredLanguage: Option.Option<PreferredLanguage>) {
      const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
      return Schema.decodeOption(PageTitlesList)(matchPreferredLanguage(resolvedLanguage, pageTitlesEn, pageTitlesPl)).pipe(
        Option.flatMap(Array.get(yield* Random.nextIntBetween(0, pageTitlesEn.length - 1)))
      );
    });

    const stablePageTitles = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
        return Schema.decodeOption(PageTitlesList)(matchPreferredLanguage(resolvedLanguage, pageTitlesEn, pageTitlesPl)).pipe(Option.flatMap(Array.head));
      });

    const experienceList = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
        return Schema.decodeUnknownOption(ExperienceList)(matchPreferredLanguage(resolvedLanguage, experienceEn, experiencePl));
      });

    const educationList = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
        return Schema.decodeOption(EducationList)(matchPreferredLanguage(resolvedLanguage, educationEn, educationPl));
      });

    const experience = (slug: Experience["slug"], preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const resolvedLanguage = requestPreferredLanguage(preferredLanguage);
        return Schema.decodeUnknownOption(ExperienceList)(matchPreferredLanguage(resolvedLanguage, experienceEn, experiencePl)).pipe(
          Option.flatMap(Array.findFirst((exp) => exp.slug === slug))
        );
      });

    return { randomPageTitles, stablePageTitles, experienceList, educationList, experience } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

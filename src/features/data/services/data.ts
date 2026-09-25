// services, features, and other libraries
import { Context, Effect, Layer, Schema } from "effect";
import { Headers } from "effect/unstable/http";
import { EducationList, ExperienceList, LocalizedContent, matchPreferredLanguage, PageTitlesList } from "@/domain";
import { Lang } from "./lang";

// assets
import pageTitlesEn from "@/assets/data/en/page-titles.json";
import pageTitlesPl from "@/assets/data/pl/page-titles.json";
import localizedContentEn from "@/assets/data/en/localized-content.json";
import localizedContentPl from "@/assets/data/pl/localized-content.json";
import experienceEn from "@/assets/data/en/experience.json";
import experiencePl from "@/assets/data/pl/experience.json";
import educationEn from "@/assets/data/en/education.json";
import educationPl from "@/assets/data/pl/education.json";

export class Data extends Context.Service<Data>()("Data", {
  make: Effect.gen(function* () {
    const { resolve } = yield* Lang;

    const pageTitlesList = Effect.fn("pageTitlesList")(function* (headers: Headers.Headers) {
      const preferredLanguage = yield* resolve(headers);
      return Schema.decodeUnknownOption(PageTitlesList)(matchPreferredLanguage(preferredLanguage, pageTitlesEn, pageTitlesPl));
    });

    const localizedContent = Effect.fn("localizedContent")(function* (headers: Headers.Headers) {
      const preferredLanguage = yield* resolve(headers);
      return Schema.decodeOption(LocalizedContent)(matchPreferredLanguage(preferredLanguage, localizedContentEn, localizedContentPl));
    });

    const experienceList = Effect.fn("experienceList")(function* (headers: Headers.Headers) {
      const preferredLanguage = yield* resolve(headers);
      return Schema.decodeUnknownOption(ExperienceList)(matchPreferredLanguage(preferredLanguage, experienceEn, experiencePl));
    });

    const educationList = Effect.fn("educationList")(function* (headers: Headers.Headers) {
      const preferredLanguage = yield* resolve(headers);
      return Schema.decodeUnknownOption(EducationList)(matchPreferredLanguage(preferredLanguage, educationEn, educationPl));
    });

    return { pageTitlesList, localizedContent, experienceList, educationList } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Lang.layer));
}

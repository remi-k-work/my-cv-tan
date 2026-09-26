// services, features, and other libraries
import { Array, Context, Effect, Layer, Option, Random, Schema } from "effect";
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

// types
import type { PreferredLanguage } from "@/domain";

export class Data extends Context.Service<Data>()("Data", {
  make: Effect.gen(function* () {
    const { resolve } = yield* Lang;

    const randomPageTitles = Effect.fn("randomPageTitles")(function* (
      preferredLanguage: Option.Option<PreferredLanguage>,
      headers: Option.Option<Headers.Headers>
    ) {
      const resolvedLanguage = yield* Option.match(preferredLanguage, {
        onNone: () => resolve(headers),
        onSome: Effect.succeed,
      });
      return Schema.decodeUnknownOption(PageTitlesList)(matchPreferredLanguage(resolvedLanguage, pageTitlesEn, pageTitlesPl)).pipe(
        Option.flatMap(Array.get(yield* Random.nextIntBetween(0, pageTitlesEn.length - 1)))
      );
    });

    const localizedContent = Effect.fn("localizedContent")(function* (
      preferredLanguage: Option.Option<PreferredLanguage>,
      headers: Option.Option<Headers.Headers>
    ) {
      const resolvedLanguage = yield* Option.match(preferredLanguage, {
        onNone: () => resolve(headers),
        onSome: Effect.succeed,
      });
      return Schema.decodeOption(LocalizedContent)(matchPreferredLanguage(resolvedLanguage, localizedContentEn, localizedContentPl));
    });

    const experienceList = Effect.fn("experienceList")(function* (
      preferredLanguage: Option.Option<PreferredLanguage>,
      headers: Option.Option<Headers.Headers>
    ) {
      const resolvedLanguage = yield* Option.match(preferredLanguage, {
        onNone: () => resolve(headers),
        onSome: Effect.succeed,
      });
      return Schema.decodeUnknownOption(ExperienceList)(matchPreferredLanguage(resolvedLanguage, experienceEn, experiencePl));
    });

    const educationList = Effect.fn("educationList")(function* (preferredLanguage: Option.Option<PreferredLanguage>, headers: Option.Option<Headers.Headers>) {
      const resolvedLanguage = yield* Option.match(preferredLanguage, {
        onNone: () => resolve(headers),
        onSome: Effect.succeed,
      });
      return Schema.decodeUnknownOption(EducationList)(matchPreferredLanguage(resolvedLanguage, educationEn, educationPl));
    });

    return { randomPageTitles, localizedContent, experienceList, educationList } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Lang.layer));
}

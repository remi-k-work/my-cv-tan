// services, features, and other libraries
import { Array, Context, Effect, Layer, Option, Random, Schema } from "effect";
import { Headers } from "effect/http";
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
import type { Experience, PreferredLanguage } from "@/domain";

export class Data extends Context.Service<Data>()("Data", {
  make: Effect.gen(function* () {
    const { resolve } = yield* Lang;

    // Resolves the effective language; an explicit preference wins, otherwise it falls back to cookie/Accept-Language resolution
    const resolveLanguage = Effect.fnUntraced(function* (preferredLanguage: Option.Option<PreferredLanguage>, headers: Option.Option<Headers.Headers>) {
      return yield* Option.match(preferredLanguage, {
        onNone: () => resolve(headers),
        onSome: Effect.succeed,
      });
    });

    const randomPageTitles = Effect.fn("randomPageTitles")(function* (
      preferredLanguage: Option.Option<PreferredLanguage>,
      headers: Option.Option<Headers.Headers>
    ) {
      const resolvedLanguage = yield* resolveLanguage(preferredLanguage, headers);
      return Schema.decodeOption(PageTitlesList)(matchPreferredLanguage(resolvedLanguage, pageTitlesEn, pageTitlesPl)).pipe(
        Option.flatMap(Array.get(yield* Random.nextIntBetween(0, pageTitlesEn.length - 1)))
      );
    });

    const localizedContent = Effect.fn("localizedContent")(function* (
      preferredLanguage: Option.Option<PreferredLanguage>,
      headers: Option.Option<Headers.Headers>
    ) {
      const resolvedLanguage = yield* resolveLanguage(preferredLanguage, headers);
      return Schema.decodeOption(LocalizedContent)(matchPreferredLanguage(resolvedLanguage, localizedContentEn, localizedContentPl));
    });

    const experienceList = Effect.fn("experienceList")(function* (
      preferredLanguage: Option.Option<PreferredLanguage>,
      headers: Option.Option<Headers.Headers>
    ) {
      const resolvedLanguage = yield* resolveLanguage(preferredLanguage, headers);
      return Schema.decodeUnknownOption(ExperienceList)(matchPreferredLanguage(resolvedLanguage, experienceEn, experiencePl));
    });

    const educationList = Effect.fn("educationList")(function* (preferredLanguage: Option.Option<PreferredLanguage>, headers: Option.Option<Headers.Headers>) {
      const resolvedLanguage = yield* resolveLanguage(preferredLanguage, headers);
      return Schema.decodeOption(EducationList)(matchPreferredLanguage(resolvedLanguage, educationEn, educationPl));
    });

    const experience = Effect.fn("experience")(function* (
      slug: Experience["slug"],
      preferredLanguage: Option.Option<PreferredLanguage>,
      headers: Option.Option<Headers.Headers>
    ) {
      const resolvedLanguage = yield* resolveLanguage(preferredLanguage, headers);
      return Schema.decodeUnknownOption(ExperienceList)(matchPreferredLanguage(resolvedLanguage, experienceEn, experiencePl)).pipe(
        Option.flatMap(Array.findFirst((exp) => exp.slug === slug))
      );
    });

    return { randomPageTitles, localizedContent, experienceList, educationList, experience } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(Lang.layer));
}

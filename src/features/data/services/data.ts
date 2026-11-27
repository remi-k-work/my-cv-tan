// services, features, and other libraries
import { Array, Context, Effect, Layer, Option, Random, Schema, pipe } from "effect";
import { experienceFromList, haveSameExperienceSlugs } from "@/features/experience/domain/helpers";
import { ExperienceList } from "@/features/experience/domain/models";
import { EducationList } from "@/features/education/domain/models";
import { PageHighlightsList } from "@/domain/models";
import { pageTitlesFromHighlights } from "@/domain/pages";
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
// the other publishes; if one bundle never decoded, a valid partner remains available because its
// reader never addresses the missing locale's routes; exported so the invariant is unit-testable
// rather than only observable through a decode of the real assets
export const localizedExperienceAsset = <A extends ReadonlyArray<Pick<Experience, "slug">>>(
  english: Option.Option<A>,
  polish: Option.Option<A>
): LocalizedAsset<A> => {
  // Both bundles decoded but disagree on the routes they publish, so neither can be served
  const disagrees = pipe(
    Option.zipWith(english, polish, (en, pl) => !haveSameExperienceSlugs(en, pl)),
    Option.getOrElse(() => false)
  );

  if (disagrees) return { en: Option.none<A>(), pl: Option.none<A>() };

  // Even without a cross-locale pair to compare, a decoded bundle must not publish ambiguous routes
  return {
    en: Option.filter(english, (experiences) => haveSameExperienceSlugs(experiences, experiences)),
    pl: Option.filter(polish, (experiences) => haveSameExperienceSlugs(experiences, experiences)),
  };
};

// The decoders are pure values, so they are built once at module scope and reused on every layer
// construction — the same "build once, use many" the captcha session's sealed-value decoder follows.
// `decodeOption` keeps compile-time checking where the imported JSON already matches the schema's
// encoded type; the experience assets mix "e" and "p" entries, which widen to `string` on import,
// so they need the decoder that accepts unknown input

const decodePageHighlightsList = Schema.decodeOption(PageHighlightsList);
const decodeExperienceList = Schema.decodeUnknownOption(ExperienceList);
const decodeEducationList = Schema.decodeOption(EducationList);

export class Data extends Context.Service<Data>()("my-cv-v4-tan/features/data/services/Data", {
  make: Effect.sync(() => {
    // Decode once at service construction; decoding to Option turns a malformed asset into None
    // (missing data downstream) instead of failing the layer
    const pageTitlesAsset = {
      en: decodePageHighlightsList(pageTitlesEn),
      pl: decodePageHighlightsList(pageTitlesPl),
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

    // Keep request-locale lookup inside the Effect: constructing an accessor outside a request and
    // running it inside one must resolve the language from the execution context, not the constructor's

    // The visible page rotates only its eyebrow and intro; the heading is the page's stable identity
    const randomPageHighlights = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.suspend(() =>
        Option.match(localized(preferredLanguage, pageTitlesAsset), {
          onNone: () => Effect.succeedNone,
          onSome: (highlights) => Effect.option(Random.choice(highlights)),
        })
      );

    // The stable titles pair the first authored highlight with the page's catalogue-declared heading
    const stablePageTitles = (preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => {
        const language = requestPreferredLanguage(preferredLanguage);
        return Option.flatMap(localized(Option.some(language), pageTitlesAsset), (highlights) =>
          Option.map(Array.head(highlights), (first) => pageTitlesFromHighlights(first, language))
        );
      });
    const experienceList = (preferredLanguage: Option.Option<PreferredLanguage>) => Effect.sync(() => localized(preferredLanguage, experienceAsset));
    const educationList = (preferredLanguage: Option.Option<PreferredLanguage>) => Effect.sync(() => localized(preferredLanguage, educationAsset));

    const experience = (slug: Experience["slug"], preferredLanguage: Option.Option<PreferredLanguage>) =>
      Effect.sync(() => Option.flatMap(localized(preferredLanguage, experienceAsset), (experiences) => experienceFromList(experiences, slug)));

    return { randomPageHighlights, stablePageTitles, experienceList, educationList, experience } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

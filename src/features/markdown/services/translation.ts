// services, features, and other libraries
import { Context, Effect, Layer, Match } from "effect";
import { translateForLanguage } from "@/lib/gt-translations";

// types
import type { Cause } from "effect";
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { TwinContext } from "@/features/markdown/domain/models";

interface ResolvedTranslation {
  readonly context: TwinContext;
  readonly fallback: boolean;
}

export type LoadTranslation = (language: PreferredLanguage) => Effect.Effect<Translate, Cause.UnknownError>;

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { SOURCE_CONTEXT } from "@/features/markdown/domain/models";

export const makeTranslation = (load: LoadTranslation) => ({
  // A failed snapshot falls back to the complete English context, never English copy behind Polish metadata
  resolve: Effect.fn("Translation.resolve")((preferredLanguage: PreferredLanguage): Effect.Effect<ResolvedTranslation> =>
    Match.value(preferredLanguage).pipe(
      Match.when(DEFAULT_LANGUAGE, () => Effect.succeed({ context: SOURCE_CONTEXT, fallback: false })),
      Match.orElse((language) =>
        load(language).pipe(
          Effect.map((translate) => ({ context: { preferredLanguage: language, translate }, fallback: false })),
          Effect.catch((error) =>
            Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${language}", falling back to ${DEFAULT_LANGUAGE}`, error).pipe(
              Effect.as({ context: SOURCE_CONTEXT, fallback: true })
            )
          )
        )
      )
    )
  ),
});

export class Translation extends Context.Service<
  Translation,
  {
    readonly resolve: (preferredLanguage: PreferredLanguage) => Effect.Effect<ResolvedTranslation>;
  }
>()("my-cv-v4-tan/features/markdown/services/Translation") {
  static readonly layerFrom = (load: LoadTranslation) => Layer.succeed(this, this.of(makeTranslation(load)));
  static readonly layer = this.layerFrom(translateForLanguage);
}

// services, features, and other libraries
import { Context, Effect, Layer } from "effect";
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
import { SOURCE_CONTEXT } from "@/features/markdown/domain/context";

export const makeTranslation = (load: LoadTranslation) => ({
  // A failed snapshot falls back to the complete English context, never English copy behind Polish metadata
  resolve: Effect.fn("Translation.resolve")(function* (preferredLanguage: PreferredLanguage): Effect.fn.Return<ResolvedTranslation> {
    if (preferredLanguage === DEFAULT_LANGUAGE) return { context: SOURCE_CONTEXT, fallback: false };

    return yield* load(preferredLanguage).pipe(
      Effect.map((translate) => ({ context: { preferredLanguage, translate }, fallback: false })),
      Effect.catch((error) =>
        Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${preferredLanguage}", falling back to ${DEFAULT_LANGUAGE}`, error).pipe(
          Effect.as({ context: SOURCE_CONTEXT, fallback: true })
        )
      )
    );
  }),
});

export class Translation extends Context.Service<
  Translation,
  {
    readonly resolve: (preferredLanguage: PreferredLanguage) => Effect.Effect<ResolvedTranslation>;
  }
>()("my-cv-v4-tan/features/markdown/services/Translation") {
  static readonly layer = Layer.succeed(this, makeTranslation(translateForLanguage));
}

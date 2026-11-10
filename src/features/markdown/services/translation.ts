// services, features, and other libraries
import { Effect } from "effect";
import { translateForLanguage } from "@/lib/gt-translations";

// types
import type { PreferredLanguage, Translate } from "@/domain/models";
import type { TwinContext } from "@/features/markdown/domain/models";

interface ResolvedTranslation {
  readonly context: TwinContext;
  readonly fallback: boolean;
}

// constants
import { DEFAULT_LANGUAGE } from "@/domain/constants";
import { SOURCE_CONTEXT } from "@/features/markdown/domain/context";

// Resolves one language context for the whole document. A failed snapshot falls back to the
// complete English context, never to English copy behind Polish metadata
export const resolveTranslation = (
  preferredLanguage: PreferredLanguage,
  load: (language: PreferredLanguage) => Promise<Translate> = translateForLanguage
): Effect.Effect<ResolvedTranslation> =>
  preferredLanguage === DEFAULT_LANGUAGE
    ? Effect.succeed({ context: SOURCE_CONTEXT, fallback: false })
    : Effect.tryPromise(() => load(preferredLanguage)).pipe(
        Effect.map((translate) => ({ context: { preferredLanguage, translate }, fallback: false })),
        Effect.catch((error) =>
          Effect.logError(`[MARKDOWN]: translation snapshot unavailable for "${preferredLanguage}", falling back to ${DEFAULT_LANGUAGE}`, error).pipe(
            Effect.as({ context: SOURCE_CONTEXT, fallback: true })
          )
        )
      );

// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { getLocale } from "gt-tanstack-start";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireData } from "@/features/data/domain/required";
import { preferredLanguageFromLocale } from "@/features/data/domain";

export const loaderRoot = createIsomorphicFn()
  .server(() =>
    serverLoader((data, preferredLanguage) =>
      Effect.gen(function* () {
        const localizedContent = yield* data.localizedContent(Option.some(preferredLanguage));
        return { preferredLanguage, localizedContent: yield* requireData(localizedContent, "localized content") } as const;
      })
    )
  )
  .client(() =>
    clientLoader((client) =>
      Effect.gen(function* () {
        const preferredLanguage = preferredLanguageFromLocale(getLocale());
        const localizedContent = yield* client.localizedContent();

        return { preferredLanguage, localizedContent: yield* requireData(localizedContent, "localized content") } as const;
      })
    )
  );

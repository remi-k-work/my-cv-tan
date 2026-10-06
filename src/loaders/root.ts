// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireData } from "@/features/data/domain/required";

export const loaderRoot = createIsomorphicFn()
  .server(() =>
    serverLoader((data, preferredLanguage) =>
      Effect.gen(function* () {
        const localizedContent = yield* data.localizedContent(Option.some(preferredLanguage), Option.none());
        return { preferredLanguage, localizedContent: yield* requireData(localizedContent, "localized content") } as const;
      })
    )
  )
  .client(() =>
    clientLoader((client) =>
      Effect.gen(function* () {
        const { preferredLanguage, localizedContent } = yield* Effect.all(
          { preferredLanguage: client.preferredLanguage(), localizedContent: client.localizedContent() },
          { concurrency: "unbounded" }
        );

        return { preferredLanguage, localizedContent: yield* requireData(localizedContent, "localized content") } as const;
      })
    )
  );

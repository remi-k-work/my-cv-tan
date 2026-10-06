// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireData } from "@/features/data/domain/required";

export const loaderContact = createIsomorphicFn()
  .server(() =>
    serverLoader((data, preferredLanguage) =>
      Effect.gen(function* () {
        const { randomPageTitles, stablePageTitles, localizedContent } = yield* Effect.all(
          {
            randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
            stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage), Option.none()),
            localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
          },
          { concurrency: "unbounded" }
        );

        return {
          preferredLanguage,
          randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
          stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
          localizedContent: yield* requireData(localizedContent, "localized content"),
        } as const;
      })
    )
  )
  .client(() =>
    clientLoader((client) =>
      Effect.gen(function* () {
        const { preferredLanguage, randomPageTitles, stablePageTitles, localizedContent } = yield* Effect.all(
          {
            preferredLanguage: client.preferredLanguage(),
            randomPageTitles: client.randomPageTitles(),
            stablePageTitles: client.stablePageTitles(),
            localizedContent: client.localizedContent(),
          },
          { concurrency: "unbounded" }
        );

        return {
          preferredLanguage,
          randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
          stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
          localizedContent: yield* requireData(localizedContent, "localized content"),
        } as const;
      })
    )
  );

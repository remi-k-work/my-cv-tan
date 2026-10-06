// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";

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
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          stablePageTitles: stablePageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
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
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          stablePageTitles: stablePageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
        } as const;
      })
    )
  );

// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireData } from "@/features/data/domain/required";

export const loaderEducation = createIsomorphicFn()
  .server(() =>
    serverLoader((data, preferredLanguage) =>
      Effect.gen(function* () {
        const { randomPageTitles, stablePageTitles, localizedContent, educationList } = yield* Effect.all(
          {
            randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
            stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage), Option.none()),
            localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
            educationList: data.educationList(Option.some(preferredLanguage), Option.none()),
          },
          { concurrency: "unbounded" }
        );

        return {
          randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
          stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
          localizedContent: yield* requireData(localizedContent, "localized content"),
          educationList: yield* requireData(educationList, "education list"),
        } as const;
      })
    )
  )
  .client(() =>
    clientLoader((client) =>
      Effect.gen(function* () {
        const { randomPageTitles, stablePageTitles, localizedContent, educationList } = yield* Effect.all(
          {
            randomPageTitles: client.randomPageTitles(),
            stablePageTitles: client.stablePageTitles(),
            localizedContent: client.localizedContent(),
            educationList: client.educationList(),
          },
          { concurrency: "unbounded" }
        );

        return {
          randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
          stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
          localizedContent: yield* requireData(localizedContent, "localized content"),
          educationList: yield* requireData(educationList, "education list"),
        } as const;
      })
    )
  );

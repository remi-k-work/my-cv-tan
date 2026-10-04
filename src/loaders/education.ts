// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";

export const loaderEducation = createIsomorphicFn()
  .server(() =>
    serverLoader((data, preferredLanguage) =>
      Effect.gen(function* () {
        const { randomPageTitles, localizedContent, educationList } = yield* Effect.all(
          {
            randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
            localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
            educationList: data.educationList(Option.some(preferredLanguage), Option.none()),
          },
          { concurrency: "unbounded" }
        );

        return {
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
          educationList: educationList.pipe(Option.getOrNull),
        } as const;
      })
    )
  )
  .client(() =>
    clientLoader((client) =>
      Effect.gen(function* () {
        const { randomPageTitles, localizedContent, educationList } = yield* Effect.all(
          {
            randomPageTitles: client.randomPageTitles(),
            localizedContent: client.localizedContent(),
            educationList: client.educationList(),
          },
          { concurrency: "unbounded" }
        );

        return {
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
          educationList: educationList.pipe(Option.getOrNull),
        } as const;
      })
    )
  );

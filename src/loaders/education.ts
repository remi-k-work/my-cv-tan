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
        const { randomPageTitles, stablePageTitles, educationList } = yield* Effect.all(
          {
            randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage)),
            stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage)),
            educationList: data.educationList(Option.some(preferredLanguage)),
          },
          { concurrency: "unbounded" }
        );

        return {
          randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
          stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
          educationList: yield* requireData(educationList, "education list"),
        } as const;
      })
    )
  )
  .client(() =>
    clientLoader((client) =>
      Effect.gen(function* () {
        const { randomPageTitles, stablePageTitles, educationList } = yield* Effect.all(
          {
            randomPageTitles: client.randomPageTitles(),
            stablePageTitles: client.stablePageTitles(),
            educationList: client.educationList(),
          },
          { concurrency: "unbounded" }
        );

        return {
          randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
          stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
          educationList: yield* requireData(educationList, "education list"),
        } as const;
      })
    )
  );

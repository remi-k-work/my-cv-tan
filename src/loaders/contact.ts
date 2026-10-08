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
        const { randomPageTitles, stablePageTitles } = yield* Effect.all(
          {
            randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage)),
            stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage)),
          },
          { concurrency: "unbounded" }
        );

        return {
          randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
          stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
        } as const;
      })
    )
  )
  .client(() =>
    clientLoader((client) =>
      Effect.gen(function* () {
        const { randomPageTitles, stablePageTitles } = yield* Effect.all(
          {
            randomPageTitles: client.randomPageTitles(),
            stablePageTitles: client.stablePageTitles(),
          },
          { concurrency: "unbounded" }
        );

        return {
          randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
          stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
        } as const;
      })
    )
  );

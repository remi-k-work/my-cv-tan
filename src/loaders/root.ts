// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";

export const loaderRoot = createIsomorphicFn()
  .server(() =>
    serverLoader((data, preferredLanguage) =>
      Effect.map(
        data.localizedContent(Option.some(preferredLanguage), Option.none()),
        (localizedContent) =>
          ({
            preferredLanguage,
            localizedContent: localizedContent.pipe(Option.getOrNull),
          }) as const
      )
    )
  )
  .client(() =>
    clientLoader((client) =>
      Effect.gen(function* () {
        const { preferredLanguage, localizedContent } = yield* Effect.all(
          { preferredLanguage: client.preferredLanguage(), localizedContent: client.localizedContent() },
          { concurrency: "unbounded" }
        );

        return {
          preferredLanguage,
          localizedContent: localizedContent.pipe(Option.getOrNull),
        } as const;
      })
    )
  );

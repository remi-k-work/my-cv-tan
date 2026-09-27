// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { RuntimeClient } from "@/lib/runtime-client";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { RpcDataClient } from "@/features/data/rpc/client";

export const loaderIndex = createIsomorphicFn()
  .server(() =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const { resolve } = yield* Lang;
        const data = yield* Data;
        const preferredLanguage = yield* resolve(Option.none());

        const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
          {
            randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
            localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
            experienceList: data.experienceList(Option.some(preferredLanguage), Option.none()),
          },
          { concurrency: "unbounded" }
        ).pipe(Effect.tapError(Effect.logError));

        return {
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
          experienceList: experienceList.pipe(Option.getOrNull),
        } as const;
      })
    )
  )
  .client(() =>
    RuntimeClient.runPromise(
      Effect.gen(function* () {
        const rpcLangClient = yield* RpcDataClient;
        const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
          {
            randomPageTitles: rpcLangClient.randomPageTitles(),
            localizedContent: rpcLangClient.localizedContent(),
            experienceList: rpcLangClient.experienceList(),
          },
          { concurrency: "unbounded" }
        ).pipe(Effect.tapError(Effect.logError));

        return {
          randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
          localizedContent: localizedContent.pipe(Option.getOrNull),
          experienceList: experienceList.pipe(Option.getOrNull),
        } as const;
      })
    )
  );

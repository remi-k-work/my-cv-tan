// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { RuntimeServer } from "@/lib/runtime-server";
import { RuntimeClient } from "@/lib/runtime-client";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { RpcDataClient } from "@/features/data/rpc/client";

export const loaderIndex = (slug: Option.Option<string>) =>
  createIsomorphicFn()
    .server(() =>
      RuntimeServer.runPromise(
        Effect.gen(function* () {
          const { resolve } = yield* Lang;
          const data = yield* Data;
          const preferredLanguage = yield* resolve(Option.none());

          if (Option.isSome(slug)) {
            const { randomPageTitles, localizedContent, experience } = yield* Effect.all(
              {
                randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
                localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
                experience: data.experience(slug.value, Option.some(preferredLanguage), Option.none()),
              },
              { concurrency: "unbounded" }
            ).pipe(Effect.tapError(Effect.logError));

            if (Option.isNone(experience)) throw notFound();

            return {
              type: "item" as const,
              randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
              localizedContent: localizedContent.pipe(Option.getOrNull),
              experience: experience.pipe(Option.getOrNull),
            } as const;
          }

          const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
            {
              randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
              localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
              experienceList: data.experienceList(Option.some(preferredLanguage), Option.none()),
            },
            { concurrency: "unbounded" }
          ).pipe(Effect.tapError(Effect.logError));

          return {
            type: "list" as const,
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
          const rpcDataClient = yield* RpcDataClient;

          if (Option.isSome(slug)) {
            const { randomPageTitles, localizedContent, experience } = yield* Effect.all(
              {
                randomPageTitles: rpcDataClient.randomPageTitles(),
                localizedContent: rpcDataClient.localizedContent(),
                experience: rpcDataClient.experience({ slug: slug.value }),
              },
              { concurrency: "unbounded" }
            ).pipe(Effect.tapError(Effect.logError));

            if (Option.isNone(experience)) throw notFound();

            return {
              type: "item" as const,
              randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
              localizedContent: localizedContent.pipe(Option.getOrNull),
              experience: experience.pipe(Option.getOrNull),
            } as const;
          }

          const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
            {
              randomPageTitles: rpcDataClient.randomPageTitles(),
              localizedContent: rpcDataClient.localizedContent(),
              experienceList: rpcDataClient.experienceList(),
            },
            { concurrency: "unbounded" }
          ).pipe(Effect.tapError(Effect.logError));

          return {
            type: "list" as const,
            randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
            localizedContent: localizedContent.pipe(Option.getOrNull),
            experienceList: experienceList.pipe(Option.getOrNull),
          } as const;
        })
      )
    )();

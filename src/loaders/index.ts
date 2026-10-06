// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";

export const loaderIndex = (slug: Option.Option<string>) =>
  createIsomorphicFn()
    .server(() =>
      serverLoader((data, preferredLanguage) =>
        Effect.gen(function* () {
          if (Option.isSome(slug)) {
            const { randomPageTitles, localizedContent, experience } = yield* Effect.all(
              {
                randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
                localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
                experience: data.experience(slug.value, Option.some(preferredLanguage), Option.none()),
              },
              { concurrency: "unbounded" }
            );

            if (Option.isNone(experience)) throw notFound();

            return {
              type: "item" as const,
              randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
              localizedContent: localizedContent.pipe(Option.getOrNull),
              experience: experience.pipe(Option.getOrNull),
            } as const;
          }

          const { randomPageTitles, stablePageTitles, localizedContent, experienceList } = yield* Effect.all(
            {
              randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
              stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage), Option.none()),
              localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
              experienceList: data.experienceList(Option.some(preferredLanguage), Option.none()),
            },
            { concurrency: "unbounded" }
          );

          return {
            type: "list" as const,
            randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
            stablePageTitles: stablePageTitles.pipe(Option.getOrNull),
            localizedContent: localizedContent.pipe(Option.getOrNull),
            experienceList: experienceList.pipe(Option.getOrNull),
          } as const;
        })
      )
    )
    .client(() =>
      clientLoader((client) =>
        Effect.gen(function* () {
          if (Option.isSome(slug)) {
            const { randomPageTitles, localizedContent, experience } = yield* Effect.all(
              {
                randomPageTitles: client.randomPageTitles(),
                localizedContent: client.localizedContent(),
                experience: client.experience({ slug: slug.value }),
              },
              { concurrency: "unbounded" }
            );

            if (Option.isNone(experience)) throw notFound();

            return {
              type: "item" as const,
              randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
              localizedContent: localizedContent.pipe(Option.getOrNull),
              experience: experience.pipe(Option.getOrNull),
            } as const;
          }

          const { randomPageTitles, stablePageTitles, localizedContent, experienceList } = yield* Effect.all(
            {
              randomPageTitles: client.randomPageTitles(),
              stablePageTitles: client.stablePageTitles(),
              localizedContent: client.localizedContent(),
              experienceList: client.experienceList(),
            },
            { concurrency: "unbounded" }
          );

          return {
            type: "list" as const,
            randomPageTitles: randomPageTitles.pipe(Option.getOrNull),
            stablePageTitles: stablePageTitles.pipe(Option.getOrNull),
            localizedContent: localizedContent.pipe(Option.getOrNull),
            experienceList: experienceList.pipe(Option.getOrNull),
          } as const;
        })
      )
    )();

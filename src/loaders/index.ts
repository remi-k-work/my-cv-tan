// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireData } from "@/features/data/domain/required";

export const loaderIndex = (slug: Option.Option<string>) =>
  createIsomorphicFn()
    .server(() =>
      serverLoader((data, preferredLanguage) =>
        Effect.gen(function* () {
          if (Option.isSome(slug)) {
            const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
              {
                randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage), Option.none()),
                localizedContent: data.localizedContent(Option.some(preferredLanguage), Option.none()),
                experienceList: data.experienceList(Option.some(preferredLanguage), Option.none()),
              },
              { concurrency: "unbounded" }
            );

            const requiredRandomPageTitles = yield* requireData(randomPageTitles, "random page titles");
            const requiredLocalizedContent = yield* requireData(localizedContent, "localized content");
            const experiences = yield* requireData(experienceList, "experience list");
            const experience = Array.findFirst(experiences, (entry) => entry.slug === slug.value);
            if (Option.isNone(experience)) throw notFound();

            return {
              type: "item" as const,
              randomPageTitles: requiredRandomPageTitles,
              localizedContent: requiredLocalizedContent,
              experience: experience.value,
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
            randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
            stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
            localizedContent: yield* requireData(localizedContent, "localized content"),
            experienceList: yield* requireData(experienceList, "experience list"),
          } as const;
        })
      )
    )
    .client(() =>
      clientLoader((client) =>
        Effect.gen(function* () {
          if (Option.isSome(slug)) {
            const { randomPageTitles, localizedContent, experienceList } = yield* Effect.all(
              {
                randomPageTitles: client.randomPageTitles(),
                localizedContent: client.localizedContent(),
                experienceList: client.experienceList(),
              },
              { concurrency: "unbounded" }
            );

            const requiredRandomPageTitles = yield* requireData(randomPageTitles, "random page titles");
            const requiredLocalizedContent = yield* requireData(localizedContent, "localized content");
            const experiences = yield* requireData(experienceList, "experience list");
            const experience = Array.findFirst(experiences, (entry) => entry.slug === slug.value);
            if (Option.isNone(experience)) throw notFound();

            return {
              type: "item" as const,
              randomPageTitles: requiredRandomPageTitles,
              localizedContent: requiredLocalizedContent,
              experience: experience.value,
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
            randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
            stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
            localizedContent: yield* requireData(localizedContent, "localized content"),
            experienceList: yield* requireData(experienceList, "experience list"),
          } as const;
        })
      )
    )();

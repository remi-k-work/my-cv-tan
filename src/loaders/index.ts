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
            const { randomPageTitles, experienceList } = yield* Effect.all(
              {
                randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage)),
                experienceList: data.experienceList(Option.some(preferredLanguage)),
              },
              { concurrency: "unbounded" }
            );

            const requiredRandomPageTitles = yield* requireData(randomPageTitles, "random page titles");
            const experiences = yield* requireData(experienceList, "experience list");
            const experience = Array.findFirst(experiences, (entry) => entry.slug === slug.value);
            if (Option.isNone(experience)) throw notFound();

            return {
              type: "item" as const,
              randomPageTitles: requiredRandomPageTitles,
              experience: experience.value,
            } as const;
          }

          const { randomPageTitles, stablePageTitles, experienceList } = yield* Effect.all(
            {
              randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage)),
              stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage)),
              experienceList: data.experienceList(Option.some(preferredLanguage)),
            },
            { concurrency: "unbounded" }
          );

          return {
            type: "list" as const,
            randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
            stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
            experienceList: yield* requireData(experienceList, "experience list"),
          } as const;
        })
      )
    )
    .client(() =>
      clientLoader((client) =>
        Effect.gen(function* () {
          if (Option.isSome(slug)) {
            const { randomPageTitles, experienceList } = yield* Effect.all(
              {
                randomPageTitles: client.randomPageTitles(),
                experienceList: client.experienceList(),
              },
              { concurrency: "unbounded" }
            );

            const requiredRandomPageTitles = yield* requireData(randomPageTitles, "random page titles");
            const experiences = yield* requireData(experienceList, "experience list");
            const experience = Array.findFirst(experiences, (entry) => entry.slug === slug.value);
            if (Option.isNone(experience)) throw notFound();

            return {
              type: "item" as const,
              randomPageTitles: requiredRandomPageTitles,
              experience: experience.value,
            } as const;
          }

          const { randomPageTitles, stablePageTitles, experienceList } = yield* Effect.all(
            {
              randomPageTitles: client.randomPageTitles(),
              stablePageTitles: client.stablePageTitles(),
              experienceList: client.experienceList(),
            },
            { concurrency: "unbounded" }
          );

          return {
            type: "list" as const,
            randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
            stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
            experienceList: yield* requireData(experienceList, "experience list"),
          } as const;
        })
      )
    )();

// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { Array, Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireData } from "@/features/data/domain/required";

// types
import type { PageData } from "./page-data";

// One loader for the home list and the /{slug} detail page: a Some(slug) fetches only
// what the item view needs; a None renders the full list page
const load = <E>(source: PageData<E>, slug: Option.Option<string>) =>
  Effect.gen(function* () {
    if (Option.isSome(slug)) {
      const { randomPageTitles, experienceList } = yield* Effect.all(
        {
          randomPageTitles: source.randomPageTitles,
          experienceList: source.experienceList,
        },
        { concurrency: "unbounded" }
      );

      const requiredRandomPageTitles = yield* requireData(randomPageTitles, "random page titles");
      const experiences = yield* requireData(experienceList, "experience list");
      const experience = Array.findFirst(experiences, (entry) => entry.slug === slug.value);

      // Defect by design so TanStack's notFound() bypasses the loader's typed-error handling
      if (Option.isNone(experience)) throw notFound();

      return {
        type: "item" as const,
        randomPageTitles: requiredRandomPageTitles,
        experience: experience.value,
      };
    }

    const { randomPageTitles, stablePageTitles, experienceList } = yield* Effect.all(
      {
        randomPageTitles: source.randomPageTitles,
        stablePageTitles: source.stablePageTitles,
        experienceList: source.experienceList,
      },
      { concurrency: "unbounded" }
    );

    return {
      type: "list" as const,
      randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
      stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
      experienceList: yield* requireData(experienceList, "experience list"),
    } as const;
  });

export const loaderIndex = (slug: Option.Option<string>) =>
  createIsomorphicFn()
    .server(() => serverLoader((source) => load(source, slug)))
    .client(() => clientLoader((source) => load(source, slug)))();

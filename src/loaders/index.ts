// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireDataFrom } from "@/features/data/domain/required";
import { experienceFromList } from "@/features/experience/domain/helpers";

// types
import type { PageData } from "./page-data";

// One loader for the home list and the /{slug} detail page: a Some(slug) fetches only
// what the item view needs; a None renders the full list page
const load = <E>(source: PageData<E>, slug: Option.Option<string>) =>
  Effect.gen(function* () {
    if (Option.isSome(slug)) {
      // `requireDataFrom` flattens the maybe-data effect, so the detail branch names its dataset
      // exactly the way the list branch below does
      const experiences = yield* requireDataFrom(source.experienceList, "experience list");
      const experience = experienceFromList(experiences, slug.value);

      // Defect by design so TanStack's notFound() bypasses the loader's typed-error handling
      if (Option.isNone(experience)) return yield* Effect.die(notFound());

      return {
        type: "item" as const,
        experience: experience.value,
      };
    }

    const { randomPageTitles, stablePageTitles, experienceList } = yield* Effect.all(
      {
        randomPageTitles: requireDataFrom(source.randomPageTitles, "random page titles"),
        stablePageTitles: requireDataFrom(source.stablePageTitles, "stable page titles"),
        experienceList: requireDataFrom(source.experienceList, "experience list"),
      },
      { concurrency: "unbounded" }
    );

    return {
      type: "list" as const,
      randomPageTitles,
      stablePageTitles,
      experienceList,
    };
  });

export const loaderIndex = (slug: Option.Option<string>) =>
  createIsomorphicFn()
    .server(() => serverLoader((source) => load(source, slug)))
    .client(() => clientLoader((source) => load(source, slug)))();

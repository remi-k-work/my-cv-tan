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
const load = Effect.fnUntraced(function* <E>(source: PageData<E>, slug: Option.Option<string>) {
  if (Option.isSome(slug)) {
    // `requireDataFrom` flattens the maybe-data effect, so the detail branch names its dataset
    // exactly the way the list branch below does
    const experiences = yield* requireDataFrom(source.experienceList, "experience list");

    return yield* Option.match(experienceFromList(experiences, slug.value), {
      // Defect by design so TanStack's notFound() bypasses the loader's typed-error handling
      onNone: () => Effect.die(notFound()),
      onSome: (experience) => Effect.succeed({ type: "item" as const, experience }),
    });
  }

  const { randomPageHighlights, experienceList } = yield* Effect.all(
    {
      randomPageHighlights: requireDataFrom(source.randomPageHighlights, "random page highlights"),
      experienceList: requireDataFrom(source.experienceList, "experience list"),
    },
    { concurrency: "unbounded" }
  );

  return {
    type: "list" as const,
    randomPageHighlights,
    experienceList,
  };
});

export const loaderIndex = createIsomorphicFn()
  .server((slug: Option.Option<string>, signal?: AbortSignal) => serverLoader((source) => load(source, slug), signal))
  .client((slug: Option.Option<string>, signal?: AbortSignal) => clientLoader((source) => load(source, slug), signal));

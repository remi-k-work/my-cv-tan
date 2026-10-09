// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireData } from "@/features/data/domain/required";

// types
import type { PageData } from "./page-data";

// Fetch both title sets concurrently, then require them
const load = <E>(source: PageData<E>) =>
  Effect.gen(function* () {
    const { randomPageTitles, stablePageTitles } = yield* Effect.all(
      {
        randomPageTitles: source.randomPageTitles,
        stablePageTitles: source.stablePageTitles,
      },
      { concurrency: "unbounded" }
    );

    return {
      randomPageTitles: yield* requireData(randomPageTitles, "random page titles"),
      stablePageTitles: yield* requireData(stablePageTitles, "stable page titles"),
    } as const;
  });

export const loaderContact = createIsomorphicFn()
  .server(() => serverLoader(load))
  .client(() => clientLoader(load));

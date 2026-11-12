// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireDataFrom } from "@/features/data/domain/required";

// types
import type { PageData } from "./page-data";

// Fetch both title sets and require them in one step: `requireDataFrom` flattens the maybe-data
// effect into the required one, so a concurrent read either produces the titles or fails by name
const load = <E>(source: PageData<E>) =>
  Effect.all(
    {
      randomPageTitles: requireDataFrom(source.randomPageTitles, "random page titles"),
      stablePageTitles: requireDataFrom(source.stablePageTitles, "stable page titles"),
    },
    { concurrency: "unbounded" }
  );

export const loaderContact = createIsomorphicFn()
  .server(() => serverLoader(load))
  .client(() => clientLoader(load));

// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireDataFrom } from "@/features/data/domain/required";

// types
import type { PageData } from "./page-data";

// Fetch the rotating copy and require it in one step: `requireDataFrom` flattens the maybe-data
// effect into the required one, so a concurrent read either produces the copy or fails by name
const load = <E>(source: PageData<E>) =>
  Effect.all(
    {
      randomPageHighlights: requireDataFrom(source.randomPageHighlights, "random page highlights"),
    },
    { concurrency: "unbounded" }
  );

export const loaderContact = createIsomorphicFn()
  .server((signal?: AbortSignal) => serverLoader(load, signal))
  .client((signal?: AbortSignal) => clientLoader(load, signal));

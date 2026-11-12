// tanstack
import { createIsomorphicFn } from "@tanstack/react-start";

// services, features, and other libraries
import { Effect } from "effect";
import { clientLoader } from "./shared";
import { serverLoader } from "./shared.server";
import { requireDataFrom } from "@/features/data/domain/required";

// types
import type { PageData } from "./page-data";

// Fetch every dataset and require it in one step, so a concurrent read either produces the data or
// fails by the name of the asset it could not read
const load = <E>(source: PageData<E>) =>
  Effect.all(
    {
      randomPageTitles: requireDataFrom(source.randomPageTitles, "random page titles"),
      stablePageTitles: requireDataFrom(source.stablePageTitles, "stable page titles"),
      educationList: requireDataFrom(source.educationList, "education list"),
    },
    { concurrency: "unbounded" }
  );

export const loaderEducation = createIsomorphicFn()
  .server(() => serverLoader(load))
  .client(() => clientLoader(load));

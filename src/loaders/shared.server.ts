// tanstack
import { getRequest } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Effect, Option } from "effect";
import { getLocale } from "gt-tanstack-start";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { markHtmlDataUnavailable } from "@/features/data/http/html-response";
import { preferredLanguageFromLocale } from "@/domain/helpers";

// types
import type { PreferredLanguage } from "@/domain/models";
import type { PageData } from "./page-data";

// Binds the Data service to one language, producing the same Effect-valued surface the RPC client exposes
const fromData = (data: Data["Service"], preferredLanguage: PreferredLanguage): PageData => ({
  randomPageTitles: data.randomPageTitles(Option.some(preferredLanguage)),
  stablePageTitles: data.stablePageTitles(Option.some(preferredLanguage)),
  experienceList: data.experienceList(Option.some(preferredLanguage)),
  educationList: data.educationList(Option.some(preferredLanguage)),
});

// Runs a server loader against the shared services, logging failures before rejecting
export const serverLoader = <A, E>(use: (source: PageData) => Effect.Effect<A, E>) => {
  const request = getRequest();

  return RuntimeServer.runPromise(
    Effect.flatMap(Data, (data) => use(fromData(data, preferredLanguageFromLocale(getLocale())))).pipe(
      Effect.tapError((error) =>
        // A failed dataset must also downgrade the rendered HTML response to a non-cacheable 503
        Effect.logError(error).pipe(Effect.andThen(Effect.sync(() => markHtmlDataUnavailable(request, error))))
      )
    )
  );
};

// tanstack
import { getRequest } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Effect } from "effect";
import { getLocale } from "gt-tanstack-start";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { markHtmlDataUnavailable } from "@/features/data/http/html-response";
import { preferredLanguageFromLocale } from "@/features/data/domain";

// types
import type { PreferredLanguage } from "@/domain";

// Runs a server loader against the shared services, logging failures before rejecting
export const serverLoader = <A, E>(use: (data: Data["Service"], preferredLanguage: PreferredLanguage) => Effect.Effect<A, E>) =>
  RuntimeServer.runPromise(
    Effect.gen(function* () {
      const preferredLanguage = yield* Effect.sync(() => preferredLanguageFromLocale(getLocale()));
      const data = yield* Data;
      return yield* use(data, preferredLanguage);
    }).pipe(
      Effect.tapError((error) => Effect.sync(() => markHtmlDataUnavailable(getRequest(), error))),
      Effect.tapError(Effect.logError)
    )
  );

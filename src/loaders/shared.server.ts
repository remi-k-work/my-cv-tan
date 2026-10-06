// services, features, and other libraries
import { Effect, Option } from "effect";
import { getRequest } from "@tanstack/react-start/server";
import { RuntimeServer } from "@/lib/runtime-server";
import { Data } from "@/features/data/services/data";
import { Lang } from "@/features/data/services/lang";
import { markHtmlDataUnavailable } from "@/features/data/http/html-response";

// types
import type { PreferredLanguage } from "@/domain";

// Resolves the visitor's preferred language on the server; cookie first, then Accept-Language
const resolvePreferredLanguage = Effect.fnUntraced(function* () {
  const { resolve } = yield* Lang;
  return yield* resolve(Option.none());
});

// Runs a server loader against the shared services, logging failures before rejecting
export const serverLoader = <A, E>(use: (data: Data["Service"], preferredLanguage: PreferredLanguage) => Effect.Effect<A, E>) =>
  RuntimeServer.runPromise(
    Effect.gen(function* () {
      const preferredLanguage = yield* resolvePreferredLanguage();
      const data = yield* Data;
      return yield* use(data, preferredLanguage);
    }).pipe(
      Effect.tapError((error) => Effect.sync(() => markHtmlDataUnavailable(getRequest(), error))),
      Effect.tapError(Effect.logError)
    )
  );

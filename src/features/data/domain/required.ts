// services, features, and other libraries
import { Effect, Option, Schema } from "effect";

export class RequiredDataError extends Schema.TaggedError<RequiredDataError, { readonly brand: unique symbol }>()("RequiredDataError", {
  dataset: Schema.String,
  message: Schema.String,
}) {}

export const requireData = <A>(data: Option.Option<A>, dataset: string): Effect.Effect<A, RequiredDataError> =>
  Effect.fromOption(data, () => new RequiredDataError({ dataset, message: `Required data is unavailable: ${dataset}` }));

// Fetch + require in one step: flattens an Effect of maybe-data into required data
export const requireDataFrom = <A, R, E>(data: Effect.Effect<Option.Option<A>, E, R>, dataset: string): Effect.Effect<A, RequiredDataError | E, R> =>
  Effect.flatMap(data, (option) => requireData(option, dataset));

// Shared recovery for every document pipeline (Markdown twins, llms.txt, sitemap): log the
// cause, then answer with the caller's fallback, built lazily so no Response is reused across
// requests. The log prefix is lazy for the same reason: a caller that names the failing document
// from its own request should not parse that request on the successful path it never fails on.
export const recoverDataFailure =
  (logPrefix: () => string, fallback: () => Response) =>
  <R>(document: Effect.Effect<Response, RequiredDataError, R>): Effect.Effect<Response, never, R> =>
    document.pipe(Effect.catchTag("RequiredDataError", (error) => Effect.logError(`${logPrefix()}: ${error.message}`).pipe(Effect.map(() => fallback()))));

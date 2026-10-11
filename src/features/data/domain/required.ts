// services, features, and other libraries
import { Effect, Option, Schema } from "effect";

export class RequiredDataError extends Schema.TaggedError<RequiredDataError>()("RequiredDataError", {
  dataset: Schema.String,
  message: Schema.String,
}) {}

export const requireData = Effect.fnUntraced(function* <A>(data: Option.Option<A>, dataset: string): Effect.fn.Return<A, RequiredDataError> {
  return yield* Effect.fromOption(data, () => new RequiredDataError({ dataset, message: `Required data is unavailable: ${dataset}` }));
});

// Shared recovery for every document pipeline (Markdown twins, llms.txt, sitemap): log the
// cause, then answer with the non-cacheable fallback Response built up front by the caller
export const recoverDataFailure =
  (logPrefix: string, fallback: Response) =>
  <R>(document: Effect.Effect<Response, RequiredDataError, R>): Effect.Effect<Response, never, R> =>
    document.pipe(Effect.catchTag("RequiredDataError", (error) => Effect.logError(`${logPrefix}: ${error.message}`).pipe(Effect.as(fallback))));

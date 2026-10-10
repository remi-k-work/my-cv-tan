// services, features, and other libraries
import { Effect, Option, Schema } from "effect";

export class RequiredDataError extends Schema.TaggedError<RequiredDataError>()("RequiredDataError", {
  dataset: Schema.String,
  message: Schema.String,
}) {}

export const requireData = Effect.fnUntraced(function* <A>(data: Option.Option<A>, dataset: string): Effect.fn.Return<A, RequiredDataError> {
  return yield* Effect.fromOption(data, () => new RequiredDataError({ dataset, message: `Required data is unavailable: ${dataset}` }));
});

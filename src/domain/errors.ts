// services, features, and other libraries
import { Schema } from "effect";

export class SendError extends Schema.TaggedError<SendError>()("SendError", {
  cause: Schema.Defect(),
  status: Schema.optionalKey(Schema.Int),
  responseBody: Schema.optionalKey(Schema.String),
}) {}

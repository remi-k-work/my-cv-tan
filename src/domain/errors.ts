// services, features, and other libraries
import { Schema } from "effect";

// The brand keeps each error nominally typed: structurally identical payloads
// can no longer be substituted for a raised SendError / CaptchaError
export class SendError extends Schema.TaggedError<SendError, { readonly brand: unique symbol }>()("SendError", {
  cause: Schema.Defect(),
  status: Schema.optionalKey(Schema.Int),
  responseBody: Schema.optionalKey(Schema.String),
}) {}

export class CaptchaError extends Schema.TaggedError<CaptchaError, { readonly brand: unique symbol }>()("CaptchaError", {
  cause: Schema.Defect(),
}) {}

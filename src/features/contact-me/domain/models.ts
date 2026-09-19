// services, features, and other libraries
import { Effect, Schema } from "effect";
import { EmailField, MessageField, NameField, SubjectField } from ".";

export class SendRequest extends Schema.Class<SendRequest>("SendRequest")({
  service_id: Schema.optionalKey(Schema.Literal("default_service").pipe(Schema.withDecodingDefaultType(Effect.succeed("default_service")))),
  template_id: Schema.optionalKey(Schema.Literal("template_mmqusic").pipe(Schema.withDecodingDefaultType(Effect.succeed("template_mmqusic")))),
  user_id: Schema.RedactedFromValue(Schema.Trim.pipe(Schema.check(Schema.isNonEmpty()))),
  accessToken: Schema.RedactedFromValue(Schema.Trim.pipe(Schema.check(Schema.isNonEmpty()))),
  template_params: Schema.Struct({ name: NameField().schema, email: EmailField().schema, subject: SubjectField().schema, message: MessageField().schema }),
}) {}

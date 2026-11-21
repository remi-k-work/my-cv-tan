// services, features, and other libraries
import { Schema } from "effect";
import { EmailField, MessageField, NameField, SubjectField } from "./fields";

// types
export type Name = Schema.Schema.Type<typeof NameField.schema>;
export type Email = Schema.Schema.Type<typeof EmailField.schema>;
export type Subject = Schema.Schema.Type<typeof SubjectField.schema>;
export type Message = Schema.Schema.Type<typeof MessageField.schema>;

export class SendRequest extends Schema.Class<SendRequest, { readonly brand: unique symbol }>("SendRequest")({
  service_id: Schema.tag("default_service"),
  template_id: Schema.tag("template_mmqusic"),
  user_id: Schema.RedactedFromValue(Schema.Trim.pipe(Schema.check(Schema.isNonEmpty()))),
  accessToken: Schema.RedactedFromValue(Schema.Trim.pipe(Schema.check(Schema.isNonEmpty()))),
  template_params: Schema.Struct({ name: NameField.schema, email: EmailField.schema, subject: SubjectField.schema, message: MessageField.schema }),
}) {}

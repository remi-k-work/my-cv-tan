// services, features, and other libraries
import { Schema } from "effect";
import { EmailField, MessageField, NameField, SubjectField } from "./fields";

// types
export type Name = (typeof SendRequest)["Type"]["template_params"]["name"];
export type Email = (typeof SendRequest)["Type"]["template_params"]["email"];
export type Subject = (typeof SendRequest)["Type"]["template_params"]["subject"];
export type Message = (typeof SendRequest)["Type"]["template_params"]["message"];

export class SendRequest extends Schema.Class<SendRequest, { readonly brand: unique symbol }>("SendRequest")({
  service_id: Schema.tag("default_service"),
  template_id: Schema.tag("template_mmqusic"),
  user_id: Schema.RedactedFromValue(Schema.Trim.pipe(Schema.check(Schema.isNonEmpty()))),
  accessToken: Schema.RedactedFromValue(Schema.Trim.pipe(Schema.check(Schema.isNonEmpty()))),
  template_params: Schema.Struct({ name: NameField.schema, email: EmailField.schema, subject: SubjectField.schema, message: MessageField.schema }),
}) {}

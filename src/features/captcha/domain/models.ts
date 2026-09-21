// services, features, and other libraries
import { Schema, Struct } from "effect";

// constants
import { STRENGTH } from ".";

class CaptchaPayload extends Schema.Class<CaptchaPayload>("CaptchaPayload")({
  captchaString: Schema.Trim.check(Schema.isNonEmpty(), Schema.isMaxLength(STRENGTH)),
}) {}

export const CaptchaPayloadJson = Schema.fromJsonString(CaptchaPayload.mapFields(Struct.pick(["captchaString"])));

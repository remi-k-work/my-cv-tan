// services, features, and other libraries
import { Schema } from "effect";

// constants
import { STRENGTH } from ".";

export class CaptchaSession extends Schema.Class<CaptchaSession>("CaptchaSession")({
  captchaString: Schema.optionalKey(Schema.Trim.check(Schema.isNonEmpty(), Schema.isMaxLength(STRENGTH))),
}) {}

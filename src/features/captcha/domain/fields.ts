// services, features, and other libraries
import { Schema } from "effect";
import { Field } from "@lucas-barake/effect-form-react";
import { msg } from "gt-tanstack-start";

// constants
import { STRENGTH } from "./constants";

export const CaptchaInputField = Field.makeField(
  "captchaInput",
  Schema.Trim.check(
    Schema.isNonEmpty({ message: msg("A captcha is required to proceed") }),
    Schema.isMaxLength(STRENGTH, { message: msg("The captcha is no more than six characters long") })
  )
);

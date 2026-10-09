// services, features, and other libraries
import { Schema } from "effect";
import { Field } from "@lucas-barake/effect-form-react";
import { msg } from "gt-tanstack-start";

// constants
import { EMAIL_REGEX } from "@/domain";

export const NameField = <K extends string = "name">(key: K = "name" as K) =>
  Field.makeField(
    key,
    Schema.Trim.check(
      Schema.isNonEmpty({ message: msg("Please provide your name; this is a necessary field") }),
      Schema.isMaxLength(25, { message: msg("Please keep the name to a maximum of 25 characters") })
    )
  );

export const EmailField = <K extends string = "email">(key: K = "email" as K) =>
  Field.makeField(
    key,
    Schema.Trim.check(
      Schema.isNonEmpty({ message: msg("Email address is required") }),
      Schema.isPattern(EMAIL_REGEX, { message: msg("The email address you gave appears to be incorrect; please update it") })
    )
  );

export const SubjectField = Field.makeField(
  "subject",
  Schema.Trim.check(
    Schema.isNonEmpty({ message: msg("Your message's subject is a required field") }),
    Schema.isMaxLength(40, { message: msg("Please keep the subject to a maximum of 40 characters") })
  )
);

export const MessageField = Field.makeField(
  "message",
  Schema.Trim.check(
    Schema.isNonEmpty({ message: msg("What is the message you want to send? This is a mandatory field") }),
    Schema.isMaxLength(2048, { message: msg("Please keep the message to a maximum of 2048 characters") })
  )
);

export const CaptchaInputField = Field.makeField(
  "captchaInput",
  Schema.Trim.check(
    Schema.isNonEmpty({ message: msg("A captcha is required to proceed") }),
    Schema.isMaxLength(6, { message: msg("The captcha is no more than six characters long") })
  )
);

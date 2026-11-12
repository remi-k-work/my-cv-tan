// services, features, and other libraries
import { Schema } from "effect";
import { Field } from "@lucas-barake/effect-form-react";
import { msg } from "gt-tanstack-start";

// constants
import { EMAIL_REGEX } from "@/domain/constants";
import { MESSAGE_MAX_LENGTH, NAME_MAX_LENGTH, SUBJECT_MAX_LENGTH } from "./constants";

export const NameField = Field.makeField(
  "name",
  Schema.Trim.check(
    Schema.isNonEmpty({ message: msg("Please provide your name; this is a necessary field") }),
    Schema.isMaxLength(NAME_MAX_LENGTH, { message: msg("Please keep the name to a maximum of 25 characters") })
  )
);

export const EmailField = Field.makeField(
  "email",
  Schema.Trim.check(
    Schema.isNonEmpty({ message: msg("Email address is required") }),
    Schema.isPattern(EMAIL_REGEX, { message: msg("The email address you gave appears to be incorrect; please update it") })
  )
);

export const SubjectField = Field.makeField(
  "subject",
  Schema.Trim.check(
    Schema.isNonEmpty({ message: msg("Your message's subject is a required field") }),
    Schema.isMaxLength(SUBJECT_MAX_LENGTH, { message: msg("Please keep the subject to a maximum of 40 characters") })
  )
);

export const MessageField = Field.makeField(
  "message",
  Schema.Trim.check(
    Schema.isNonEmpty({ message: msg("What is the message you want to send? This is a mandatory field") }),
    Schema.isMaxLength(MESSAGE_MAX_LENGTH, { message: msg("Please keep the message to a maximum of 2048 characters") })
  )
);

// services, features, and other libraries
import { Schema } from "effect";
import { Field } from "@lucas-barake/effect-form-react";

// types
import type { PreferredLanguage } from ".";

// constants
import { EMAIL_REGEX } from ".";

export const NameField = <K extends string = "name">(preferredLanguage: PreferredLanguage = "en", key: K = "name" as K) =>
  preferredLanguage === "en"
    ? Field.makeField(
        key,
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "Please provide your name; this is a necessary field" }),
          Schema.isMaxLength(25, { message: "Please keep the name to a maximum of 25 characters" })
        )
      )
    : Field.makeField(
        key,
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "Proszę podać swoje imię; jest to pole obowiązkowe" }),
          Schema.isMaxLength(25, { message: "Imię powinno mieć maksymalnie 25 znaków" })
        )
      );

export const EmailField = <K extends string = "email">(preferredLanguage: PreferredLanguage = "en", key: K = "email" as K) =>
  preferredLanguage === "en"
    ? Field.makeField(
        key,
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "Email address is required" }),
          Schema.isPattern(EMAIL_REGEX, { message: "The email address you gave appears to be incorrect; please update it" })
        )
      )
    : Field.makeField(
        key,
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "Adres e-mail jest wymagany" }),
          Schema.isPattern(EMAIL_REGEX, { message: "Podany adres e-mail wydaje się być niepoprawny. Proszę go zaktualizować" })
        )
      );

export const SubjectField = (preferredLanguage: PreferredLanguage = "en") =>
  preferredLanguage === "en"
    ? Field.makeField(
        "subject",
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "Your message's subject is a required field" }),
          Schema.isMaxLength(40, { message: "Please keep the subject to a maximum of 40 characters" })
        )
      )
    : Field.makeField(
        "subject",
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "Temat Twojej wiadomości jest polem wymaganym" }),
          Schema.isMaxLength(40, { message: "Temat wiadomości powinien mieć maksymalnie 40 znaków" })
        )
      );

export const MessageField = (preferredLanguage: PreferredLanguage = "en") =>
  preferredLanguage === "en"
    ? Field.makeField(
        "message",
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "What is the message you want to send? This is a mandatory field" }),
          Schema.isMaxLength(2048, { message: "Please keep the message to a maximum of 2048 characters" })
        )
      )
    : Field.makeField(
        "message",
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "Jaką wiadomość chcesz wysłać? Jest to pole obowiązkowe" }),
          Schema.isMaxLength(2048, { message: "Wiadomość nie może mieć więcej niż 2048 znaków" })
        )
      );

export const CaptchaInputField = (preferredLanguage: PreferredLanguage = "en") =>
  preferredLanguage === "en"
    ? Field.makeField(
        "captchaInput",
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "A captcha is required to proceed" }),
          Schema.isMaxLength(6, { message: "The captcha is no more than six characters long" })
        )
      )
    : Field.makeField(
        "captchaInput",
        Schema.Trim.check(
          Schema.isNonEmpty({ message: "Captcha jest wymagane aby kontynuować" }),
          Schema.isMaxLength(6, { message: "Captcha musi być nie dłuższe niż 6 znaków" })
        )
      );

// services, features, and other libraries
import { Effect } from "effect";
import { FormBuilder } from "@lucas-barake/effect-form-react";
import { RpcMainClient } from "@/rpc/client";
import { CaptchaInputField, EmailField, MessageField, NameField, SubjectField } from ".";

// types
import type { PreferredLanguage } from ".";

export const contactFormBuilder = (preferredLanguage: PreferredLanguage) =>
  FormBuilder.empty
    .addField(NameField(preferredLanguage))
    .addField(EmailField(preferredLanguage))
    .addField(SubjectField(preferredLanguage))
    .addField(MessageField(preferredLanguage))
    .addField(CaptchaInputField(preferredLanguage))
    .refineEffect(({ captchaInput }) =>
      Effect.gen(function* () {
        // Check the captcha to ensure it matches
        const { isCaptchaValid } = yield* RpcMainClient;
        if (!(yield* isCaptchaValid({ captchaInput })))
          return { path: ["captchaInput"], issue: preferredLanguage === "en" ? "Entered captcha is invalid" : "Wpisana captcha jest nieprawidłowa" };
      }).pipe(Effect.orElseSucceed(() => undefined))
    );

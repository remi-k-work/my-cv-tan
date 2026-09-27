// services, features, and other libraries
import { Effect } from "effect";
import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react";
import { RpcCaptchaClient } from "@/features/captcha/rpc/client";
import { RpcContactMeClient } from "@/features/contact-me/rpc/client";
import { RuntimeAtom } from "@/lib/runtime-client";
import { CaptchaInputField, EmailField, MessageField, NameField, SubjectField } from ".";

// components
import { TextAreaInput, TextInput } from "@/ui/form";

// types
import type { PreferredLanguage } from "@/domain";
export type ContactForm = ReturnType<typeof contactForm>;

const contactFormBuilder = (preferredLanguage: PreferredLanguage) =>
  FormBuilder.empty
    .addField(NameField(preferredLanguage))
    .addField(EmailField(preferredLanguage))
    .addField(SubjectField(preferredLanguage))
    .addField(MessageField(preferredLanguage))
    .addField(CaptchaInputField(preferredLanguage))
    .refineEffect(({ captchaInput }) =>
      Effect.gen(function* () {
        // Check the captcha to ensure it matches
        const { isCaptchaValid } = yield* RpcCaptchaClient;
        if (!(yield* isCaptchaValid({ captchaInput })))
          return { path: ["captchaInput"], issue: preferredLanguage === "en" ? "Entered captcha is invalid" : "Wpisana captcha jest nieprawidłowa" };
      }).pipe(
        Effect.orElseSucceed(() => ({
          path: ["captchaInput"],
          issue: preferredLanguage === "en" ? "Something went wrong, please try again later" : "Wystąpił błąd, spróbuj ponownie później",
        }))
      )
    );

export const contactForm = (preferredLanguage: PreferredLanguage) =>
  FormReact.make(contactFormBuilder(preferredLanguage), {
    runtime: RuntimeAtom,
    fields: {
      name: TextInput,
      email: TextInput,
      subject: TextInput,
      message: TextAreaInput,
      captchaInput: TextInput,
    },
    onSubmit: (_, { decoded: { name, email, subject, message } }) =>
      Effect.gen(function* () {
        const { contactForm } = yield* RpcContactMeClient;
        yield* contactForm({ name, email, subject, message });
      }),
  });

// services, features, and other libraries
import { Effect } from "effect";
import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react";
import { RpcCaptchaClient } from "@/features/captcha/rpc/client";
import { RpcContactMeClient } from "@/features/contact-me/rpc/client";
import { RuntimeAtom } from "@/lib/runtime-client";
import { CaptchaInputField, EmailField, MessageField, NameField, SubjectField } from "./fields";

// components
import { TextAreaInput, TextInput } from "@/ui/form";

// types
export type ContactForm = ReturnType<typeof contactForm>;

const contactFormBuilder = FormBuilder.empty
  .addField(NameField())
  .addField(EmailField())
  .addField(SubjectField)
  .addField(MessageField)
  .addField(CaptchaInputField)
  .refineEffect(({ captchaInput }) =>
    Effect.gen(function* () {
      // Check the captcha to ensure it matches
      const { isCaptchaValid } = yield* RpcCaptchaClient;
      if (!(yield* isCaptchaValid({ captchaInput }))) return { path: ["captchaInput"], issue: "Entered captcha is invalid" };
    }).pipe(
      Effect.orElseSucceed(() => ({
        path: ["captchaInput"],
        issue: "Something went wrong, please try again later",
      }))
    )
  );

export const contactForm = () =>
  FormReact.make(contactFormBuilder, {
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

// services, features, and other libraries
import { Effect } from "effect";
import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react";
import { msg } from "gt-tanstack-start";
import { CaptchaInputField } from "@/features/captcha/domain/fields";
import { RpcCaptchaClient } from "@/features/captcha/rpc/client";
import { RpcContactMeClient } from "@/features/contact-me/rpc/client";
import { RuntimeAtom } from "@/lib/runtime-client";
import { EmailField, MessageField, NameField, SubjectField } from "./fields";

// components
import { TextAreaInput } from "@/ui/form/inputs/text-area";
import { TextInput } from "@/ui/form/inputs/text";

// types
export type ContactForm = ReturnType<typeof contactForm>;

const contactFormBuilder = FormBuilder.empty
  .addField(NameField)
  .addField(EmailField)
  .addField(SubjectField)
  .addField(MessageField)
  .addField(CaptchaInputField)
  .refineEffect(({ captchaInput }) =>
    Effect.gen(function* () {
      // Check the captcha to ensure it matches
      const { isCaptchaValid } = yield* RpcCaptchaClient;
      if (!(yield* isCaptchaValid({ captchaInput }))) return { path: ["captchaInput"], issue: msg("Entered captcha is invalid") };
    }).pipe(
      Effect.tapError(Effect.logError),
      Effect.orElseSucceed(() => ({
        path: ["captchaInput"],
        issue: msg("Something went wrong, please try again later"),
      }))
    )
  );

export const contactForm = () =>
  FormReact.make(contactFormBuilder, {
    runtime: RuntimeAtom,
    fields: { name: TextInput, email: TextInput, subject: TextInput, message: TextAreaInput, captchaInput: TextInput },
    onSubmit: (_, { decoded: { name, email, subject, message, captchaInput } }) =>
      Effect.flatMap(RpcContactMeClient, ({ contactForm: submit }) => submit({ name, email, subject, message, captchaInput })),
  });

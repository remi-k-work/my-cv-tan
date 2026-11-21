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
    // Check the captcha to ensure it matches: the refine maps the answer onto its issue, and a
    // transport failure degrades to the retry issue instead of failing the (never-error) refine
    Effect.flatMap(RpcCaptchaClient, ({ isCaptchaValid }) => isCaptchaValid({ captchaInput })).pipe(
      Effect.map((isValid) => (isValid ? undefined : { path: ["captchaInput"], issue: msg("Entered captcha is invalid") })),
      Effect.catch((error) =>
        Effect.logError(error).pipe(
          Effect.as({
            path: ["captchaInput"],
            issue: msg("Something went wrong, please try again later"),
          })
        )
      )
    )
  );

export const contactForm = () =>
  FormReact.make(contactFormBuilder, {
    runtime: RuntimeAtom,
    fields: { name: TextInput, email: TextInput, subject: TextInput, message: TextAreaInput, captchaInput: TextInput },
    onSubmit: (_, { decoded: { name, email, subject, message, captchaInput } }) =>
      Effect.flatMap(RpcContactMeClient, ({ contactForm: submit }) => submit({ name, email, subject, message, captchaInput })),
  });

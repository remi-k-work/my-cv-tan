// react
import { useMemo } from "react";

// services, features, and other libraries
import { Effect } from "effect";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { FormReact } from "@lucas-barake/effect-form-react";
import { contactFormBuilder } from "@/features/contact-me/domain/forms";
import { RuntimeAtom } from "@/lib/runtime-client";
import useContactFormFeedback from "@/hooks/useContactFormFeedback";

// components
import { FormSubmit, TextAreaInput, TextInput } from "@/components/form";
import { Captcha } from "@/features/captcha/ui/captcha";

// types
import type { PreferredLanguage } from "@/domain";
import type { LocalizedContent } from "@/types/shared";

interface ContactFormProps {
  preferredLanguage: PreferredLanguage;
  localizedContent: LocalizedContent;
}

// constants
const contactForm = (preferredLanguage: PreferredLanguage) =>
  FormReact.make(contactFormBuilder(preferredLanguage), {
    runtime: RuntimeAtom,
    fields: {
      name: TextInput,
      email: TextInput,
      subject: TextInput,
      message: TextAreaInput,
      captchaInput: TextInput,
    },
    onSubmit: (_, { decoded: { name, email, subject, message, captchaInput } }) =>
      Effect.gen(function* () {
        yield* Effect.sleep(2000);
        yield* Effect.log("Contact form submitted");
        yield* Effect.log({ name, email, subject, message, captchaInput });
      }),
  });

export function ContactForm({ preferredLanguage, localizedContent }: ContactFormProps) {
  // Get the form context
  const contactFormL = useMemo(() => contactForm(preferredLanguage), [preferredLanguage]);
  const submit = useAtomSet(contactFormL.submit);

  // Provide feedback to the user regarding contact form actions
  // useContactFormFeedback(formState, localizedContent, reset);

  return (
    <contactFormL.Initialize defaultValues={{ name: "", email: "", subject: "", message: "", captchaInput: "" }}>
      <form
        className="mx-auto w-full max-w-4xl rounded-xl bg-background p-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          submit();
        }}
      >
        <contactFormL.name
          label={localizedContent["contactForm"]["labelName"]}
          size={40}
          maxLength={26}
          spellCheck={false}
          autoComplete="name"
          placeholder={localizedContent["contactForm"]["placeholderName"]}
        />
        <contactFormL.email
          label={localizedContent["contactForm"]["labelEmail"]}
          size={40}
          maxLength={50}
          spellCheck={false}
          autoComplete="email"
          placeholder={localizedContent["contactForm"]["placeholderEmail"]}
        />
        <contactFormL.subject
          label={localizedContent["contactForm"]["labelSubject"]}
          size={40}
          maxLength={41}
          spellCheck
          autoComplete="off"
          placeholder={localizedContent["contactForm"]["placeholderSubject"]}
        />
        <contactFormL.message
          label={localizedContent["contactForm"]["labelMessage"]}
          cols={50}
          rows={8}
          maxLength={2049}
          spellCheck
          autoComplete="off"
          placeholder={localizedContent["contactForm"]["placeholderMessage"]}
        />
        <br />
        <Captcha />
        <br />
        <contactFormL.captchaInput
          label={localizedContent["contactForm"]["labelCaptcha"]}
          size={40}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          placeholder={localizedContent["contactForm"]["placeholderCaptcha"]}
        />
        <br />
        <FormSubmit form={contactFormL} localizedContent={localizedContent} />
      </form>
    </contactFormL.Initialize>
  );
}

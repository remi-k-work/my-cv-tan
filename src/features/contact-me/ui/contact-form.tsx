// react
import { useMemo } from "react";

// services, features, and other libraries
import { useAtomSet } from "@effect/atom-react";
import { contactForm } from "@/features/contact-me/domain";
import { useSubmitToast } from "@/features/contact-me/hooks";

// components
import { Captcha } from "@/features/captcha/ui/captcha";
import { SubmitStatus } from "./submit-status";
import { FormSubmit } from "./form-submit";

// types
import type { LocalizedContent, PreferredLanguage } from "@/domain";

interface ContactFormProps {
  preferredLanguage: PreferredLanguage;
  localizedContent: LocalizedContent;
}

export function ContactForm({ preferredLanguage, localizedContent }: ContactFormProps) {
  // Get the form context
  const form = useMemo(() => contactForm(preferredLanguage), [preferredLanguage]);
  const submit = useAtomSet(form.submit);

  // Provide feedback to the user regarding this form actions
  useSubmitToast(form, localizedContent);

  // Labels and placeholders of the form's fields
  const labels = localizedContent["contactForm"];

  return (
    <form.Initialize defaultValues={{ name: "", email: "", subject: "", message: "", captchaInput: "" }}>
      <form
        className="mx-auto w-full max-w-4xl rounded-xl bg-surface-1 p-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          submit();
        }}
      >
        <form.name label={labels["labelName"]} size={20} maxLength={26} spellCheck={false} autoComplete="name" placeholder={labels["placeholderName"]} />
        <form.email label={labels["labelEmail"]} size={20} maxLength={50} spellCheck={false} autoComplete="email" placeholder={labels["placeholderEmail"]} />
        <form.subject label={labels["labelSubject"]} size={20} maxLength={41} spellCheck autoComplete="off" placeholder={labels["placeholderSubject"]} />
        <form.message
          label={labels["labelMessage"]}
          cols={30}
          rows={8}
          maxLength={2049}
          spellCheck
          autoComplete="off"
          placeholder={labels["placeholderMessage"]}
        />
        <br />
        <Captcha />
        <br />
        <form.captchaInput
          label={labels["labelCaptcha"]}
          size={20}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          placeholder={labels["placeholderCaptcha"]}
        />
        <br />
        <SubmitStatus contactForm={form} localizedContent={localizedContent} />
        <FormSubmit contactForm={form} localizedContent={localizedContent} />
      </form>
    </form.Initialize>
  );
}

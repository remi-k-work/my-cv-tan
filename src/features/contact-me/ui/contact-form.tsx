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
  const contactFormL = useMemo(() => contactForm(preferredLanguage), [preferredLanguage]);
  const submit = useAtomSet(contactFormL.submit);

  // Provide feedback to the user regarding this form actions
  useSubmitToast(contactFormL, localizedContent);

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
        <SubmitStatus contactForm={contactFormL} localizedContent={localizedContent} />
        <FormSubmit contactForm={contactFormL} localizedContent={localizedContent} />
      </form>
    </contactFormL.Initialize>
  );
}

// services, features, and other libraries
import { useAtomSet } from "@effect/atom-react";
import { contactForm } from "@/features/contact-me/domain";
import { useSubmitToast } from "@/features/contact-me/hooks";
import { useGT } from "gt-tanstack-start";

// components
import { Captcha } from "@/features/captcha/ui/captcha";
import { SubmitStatus } from "./submit-status";
import { FormSubmit } from "./form-submit";

// constants
import { UI_COPY } from "@/features/data/domain/ui-copy";

export function ContactForm() {
  const gt = useGT();

  // Get the form context
  const form = contactForm();
  const submit = useAtomSet(form.submit);

  // Provide feedback to the user regarding this form actions
  useSubmitToast(form);

  // Labels and placeholders of the form's fields
  const labels = UI_COPY.contactForm;

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
        <form.name
          label={gt(labels["labelName"])}
          size={20}
          maxLength={26}
          spellCheck={false}
          autoComplete="name"
          placeholder={gt(labels["placeholderName"])}
        />
        <form.email
          label={gt(labels["labelEmail"])}
          size={20}
          maxLength={50}
          spellCheck={false}
          autoComplete="email"
          placeholder={gt(labels["placeholderEmail"])}
        />
        <form.subject
          label={gt(labels["labelSubject"])}
          size={20}
          maxLength={41}
          spellCheck
          autoComplete="off"
          placeholder={gt(labels["placeholderSubject"])}
        />
        <form.message
          label={gt(labels["labelMessage"])}
          cols={30}
          rows={8}
          maxLength={2049}
          spellCheck
          autoComplete="off"
          placeholder={gt(labels["placeholderMessage"])}
        />
        <br />
        <Captcha />
        <br />
        <form.captchaInput
          label={gt(labels["labelCaptcha"])}
          size={20}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          placeholder={gt(labels["placeholderCaptcha"])}
        />
        <br />
        <SubmitStatus contactForm={form} />
        <FormSubmit contactForm={form} />
      </form>
    </form.Initialize>
  );
}

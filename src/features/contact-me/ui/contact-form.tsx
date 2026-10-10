// react
import { useMemo } from "react";

// services, features, and other libraries
import { useAtomSet } from "@effect/atom-react";
import { contactForm } from "@/features/contact-me/domain";
import { useSubmitToast } from "@/features/contact-me/hooks";
import { useGT } from "gt-tanstack-start";

// components
import { Captcha } from "@/features/captcha/ui/captcha";
import { SubmitStatus } from "./submit-status";
import { FormSubmit } from "./form-submit";

export function ContactForm() {
  const gt = useGT();

  // Get the form context
  const form = useMemo(() => contactForm(), []);
  const submit = useAtomSet(form.submit);

  // Provide feedback to the user regarding this form actions
  useSubmitToast(form);

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
        <form.name label={gt("Name")} size={20} maxLength={26} spellCheck={false} autoComplete="name" placeholder={gt("Let me know who you are!")} />
        <form.email label={gt("Email")} size={20} maxLength={50} spellCheck={false} autoComplete="email" placeholder={gt("I will reply to you here")} />
        <form.subject
          label={gt("Subject")}
          size={20}
          maxLength={41}
          spellCheck
          autoComplete="off"
          placeholder={gt("Project Inquiry? Feedback? Let me know!")}
        />
        <form.message label={gt("Message")} cols={30} rows={8} maxLength={2049} spellCheck autoComplete="off" placeholder={gt("How can I help you today?")} />
        <br />
        <Captcha />
        <br />
        <form.captchaInput
          label={gt("Captcha")}
          size={20}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          placeholder={gt("Enter the generated captcha")}
        />
        <br />
        <SubmitStatus contactForm={form} />
        <FormSubmit contactForm={form} />
      </form>
    </form.Initialize>
  );
}

// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useAtomSet } from "@effect/atom-react";
import { contactForm } from "@/features/contact-me/domain/forms";
import { useSubmitToast } from "@/features/contact-me/hooks/use-submit-toast";
import { useGT } from "gt-tanstack-start";

// components
import { Captcha } from "@/features/captcha/ui/captcha";
import { SubmitStatus } from "./submit-status";
import { FormSubmit } from "./form-submit";

// constants
const form = contactForm();

export function ContactForm() {
  const gt = useGT();

  // Get the form context
  const submit = useAtomSet(form.submit);

  // Provide feedback to the user regarding this form actions
  useSubmitToast(form);

  return (
    <form.Initialize defaultValues={{ name: "", email: "", subject: "", message: "", captchaInput: "" }}>
      <form
        className={cn(
          "mx-auto w-full max-w-4xl rounded-xl border border-transparent bg-surface-1 p-3 transition duration-300",
          "focus-within:border-accent focus-within:shadow-[0_0_18px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
        )}
        aria-label={gt("Contact Form")}
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

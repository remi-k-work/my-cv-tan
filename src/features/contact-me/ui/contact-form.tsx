// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useGT } from "gt-tanstack-start";
import { useContactForm } from "@/features/contact-me/hooks/use-contact-form";

// components
import { ContactFormFields } from "./contact-form-fields";
import { SubmitStatus } from "./submit-status";
import { FormSubmit } from "./form-submit";

export function ContactForm() {
  const gt = useGT();
  const { form, handleSubmitted } = useContactForm();

  return (
    <form.Initialize defaultValues={{ name: "", email: "", subject: "", message: "", captchaInput: "" }}>
      <form
        className={cn(
          "mx-auto w-full max-w-4xl rounded-xl border border-transparent bg-surface-1 p-3 transition duration-300",
          "focus-within:border-accent focus-within:shadow-[0_0_18px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
        )}
        aria-label={gt("Contact Form")}
        onSubmit={handleSubmitted}
      >
        <ContactFormFields form={form} />
        <SubmitStatus submit={form.submit} />
        <FormSubmit form={form} />
      </form>
    </form.Initialize>
  );
}

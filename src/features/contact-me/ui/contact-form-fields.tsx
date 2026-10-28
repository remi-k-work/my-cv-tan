// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { Captcha } from "@/features/captcha/ui/captcha";

// types
import type { ContactForm } from "@/features/contact-me/domain/forms";

interface ContactFormFieldsProps {
  form: ContactForm;
}

// All the input fields of the contact form, each wrapped in a consistent ContactField spacer
export function ContactFormFields({ form }: ContactFormFieldsProps) {
  const gt = useGT();

  return (
    <>
      <form.name label={gt("Name")} size={20} maxLength={26} spellCheck={false} autoComplete="name" placeholder={gt("Let me know who you are!")} />
      <form.email label={gt("Email")} size={20} maxLength={50} spellCheck={false} autoComplete="email" placeholder={gt("I will reply to you here")} />
      <form.subject label={gt("Subject")} size={20} maxLength={41} spellCheck autoComplete="off" placeholder={gt("Project Inquiry? Feedback? Let me know!")} />
      <form.message label={gt("Message")} cols={30} rows={8} maxLength={2049} spellCheck autoComplete="off" placeholder={gt("How can I help you today?")} />
      <br />
      <Captcha />
      <br />
      <form.captchaInput label={gt("Captcha")} size={20} maxLength={7} spellCheck={false} autoComplete="off" placeholder={gt("Enter the generated captcha")} />
    </>
  );
}

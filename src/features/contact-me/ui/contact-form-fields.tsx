// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { Captcha } from "@/features/captcha/ui/captcha";

// types
import type { ContactForm } from "@/features/contact-me/domain/forms";

interface ContactFormFieldsProps {
  form: ContactForm;
}

// constants
import { MESSAGE_MAX_LENGTH, NAME_MAX_LENGTH, SUBJECT_MAX_LENGTH } from "@/features/contact-me/domain/constants";
import { STRENGTH } from "@/features/captcha/domain/constants";

// Every schema-limited input admits one character past its limit (see the domain constants)
export function ContactFormFields({ form }: ContactFormFieldsProps) {
  const gt = useGT();

  return (
    <>
      <form.name
        label={gt("Name")}
        size={20}
        maxLength={NAME_MAX_LENGTH + 1}
        spellCheck={false}
        autoComplete="name"
        placeholder={gt("Let me know who you are!")}
      />
      <form.email label={gt("Email")} size={20} maxLength={50} spellCheck={false} autoComplete="email" placeholder={gt("I will reply to you here")} />
      <form.subject
        label={gt("Subject")}
        size={20}
        maxLength={SUBJECT_MAX_LENGTH + 1}
        spellCheck
        autoComplete="off"
        placeholder={gt("Project Inquiry? Feedback? Let me know!")}
      />
      <form.message
        label={gt("Message")}
        cols={30}
        rows={8}
        maxLength={MESSAGE_MAX_LENGTH + 1}
        spellCheck
        autoComplete="off"
        placeholder={gt("How can I help you today?")}
      />
      <br />
      <Captcha />
      <br />
      <form.captchaInput
        label={gt("Captcha")}
        size={20}
        maxLength={STRENGTH + 1}
        spellCheck={false}
        autoComplete="off"
        placeholder={gt("Enter the generated captcha")}
      />
    </>
  );
}

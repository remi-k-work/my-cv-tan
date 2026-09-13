/* eslint-disable react/no-children-prop */

"use client";

// react
import { useActionState } from "react";

// server actions and mutations
import newContact from "@/actions/contactForm";

// other libraries
import { mergeForm, useTransform } from "@tanstack/react-form-nextjs";
import { useAppForm } from "@/components/form";
import { ContactFormSchemaEn, ContactFormSchemaPl } from "@/schemas/contactForm";
import useContactFormFeedback from "@/hooks/useContactFormFeedback";

// components
import Captcha from "@/features/auth/components/Captcha";

// types
import type { Lang, LocalizedContent } from "@/types/shared";

interface ContactFormProps {
  preferredLang: Lang;
  localizedContent: LocalizedContent;
}

// constants
import { FORM_OPTIONS_EN, FORM_OPTIONS_PL, INITIAL_FORM_STATE } from "@/schemas/formFactory";

export default function ContactForm({ preferredLang, localizedContent }: ContactFormProps) {
  const [formState, formAction, isPending] = useActionState(newContact, INITIAL_FORM_STATE);
  const { AppField, AppForm, FormSubmit, handleSubmit, reset } = useAppForm({
    ...(preferredLang === "en" ? FORM_OPTIONS_EN : FORM_OPTIONS_PL),
    transform: useTransform((baseForm) => mergeForm(baseForm, formState), [formState]),
  });

  // Provide feedback to the user regarding contact form actions
  useContactFormFeedback(formState, localizedContent, reset);

  return (
    <AppForm>
      <form action={formAction} className="bg-background mx-auto w-full max-w-4xl rounded-xl p-3" onSubmit={() => handleSubmit()}>
        <AppField
          name="name"
          validators={{ onChange: preferredLang === "en" ? ContactFormSchemaEn.shape.name : ContactFormSchemaPl.shape.name }}
          children={(field) => (
            <field.TextField
              label={localizedContent["contactForm"]["labelName"]}
              size={40}
              maxLength={26}
              spellCheck={false}
              autoComplete="name"
              placeholder={localizedContent["contactForm"]["placeholderName"]}
            />
          )}
        />
        <AppField
          name="email"
          validators={{ onChange: preferredLang === "en" ? ContactFormSchemaEn.shape.email : ContactFormSchemaPl.shape.email }}
          children={(field) => (
            <field.TextField
              label={localizedContent["contactForm"]["labelEmail"]}
              size={40}
              maxLength={50}
              spellCheck={false}
              autoComplete="email"
              placeholder={localizedContent["contactForm"]["placeholderEmail"]}
            />
          )}
        />
        <AppField
          name="subject"
          validators={{ onChange: preferredLang === "en" ? ContactFormSchemaEn.shape.subject : ContactFormSchemaPl.shape.subject }}
          children={(field) => (
            <field.TextField
              label={localizedContent["contactForm"]["labelSubject"]}
              size={40}
              maxLength={41}
              spellCheck
              autoComplete="off"
              placeholder={localizedContent["contactForm"]["placeholderSubject"]}
            />
          )}
        />
        <AppField
          name="message"
          validators={{ onChange: preferredLang === "en" ? ContactFormSchemaEn.shape.message : ContactFormSchemaPl.shape.message }}
          children={(field) => (
            <field.TextAreaField
              label={localizedContent["contactForm"]["labelMessage"]}
              cols={50}
              rows={8}
              maxLength={2049}
              spellCheck
              autoComplete="off"
              placeholder={localizedContent["contactForm"]["placeholderMessage"]}
            />
          )}
        />
        <br />
        <Captcha captchaName="captcha" />
        <br />
        <AppField
          name="captcha"
          validators={{ onChange: preferredLang === "en" ? ContactFormSchemaEn.shape.captcha : ContactFormSchemaPl.shape.captcha }}
          children={(field) => (
            <field.TextField
              label={localizedContent["contactForm"]["labelCaptcha"]}
              size={40}
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              placeholder={localizedContent["contactForm"]["placeholderCaptcha"]}
            />
          )}
        />
        <br />
        <FormSubmit localizedContent={localizedContent} isPending={isPending} />
      </form>
    </AppForm>
  );
}

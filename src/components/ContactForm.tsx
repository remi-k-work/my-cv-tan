/* eslint-disable react/no-children-prop */

import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { submitContact } from "@/server/contact.functions";
import type { ContactFormResult } from "@/server/contact.functions";

import { useAppForm } from "@/components/form";
import { ContactFormSchemaEn, ContactFormSchemaPl } from "@/schemas/contactForm";
import useContactFormFeedback from "@/hooks/useContactFormFeedback";

import Captcha from "@/features/auth/components/Captcha";

import type { Lang, LocalizedContent } from "@/types/shared";

interface ContactFormProps {
  preferredLang: Lang;
  localizedContent: LocalizedContent;
}

import { FORM_OPTIONS_EN, FORM_OPTIONS_PL } from "@/schemas/formFactory";

const IDLE_RESULT: ContactFormResult = { actionStatus: "idle" };

export default function ContactForm({ preferredLang, localizedContent }: ContactFormProps) {
  const [formState, setFormState] = useState<ContactFormResult>(IDLE_RESULT);
  const [isPending, setIsPending] = useState(false);
  const submit = useServerFn(submitContact);
  const router = useRouter();

  const form = useAppForm({
    ...(preferredLang === "en" ? FORM_OPTIONS_EN : FORM_OPTIONS_PL),
  });
  const { AppField, AppForm, FormSubmit, handleSubmit, reset } = form;

  useContactFormFeedback(formState, localizedContent, reset);

  return (
    <AppForm>
      <form
        className="bg-background mx-auto w-full max-w-4xl rounded-xl p-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          void handleSubmit();
          const values = form.state.values as { name: string; email: string; subject: string; message: string; captcha: string };
          setIsPending(true);
          submit({ data: values })
            .then(async (result) => {
              setFormState(result);
              if (result.actionStatus === "succeeded") await router.invalidate();
            })
            .catch(() => setFormState({ actionStatus: "failed" }))
            .finally(() => setIsPending(false));
        }}
      >
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

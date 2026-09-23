// services, features, and other libraries
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";

// components
import { InfoLine } from "@/components/info-line";

// types
import type { ContactForm } from "@/features/contact-me/domain";
import type { LocalizedContent } from "@/domain";

interface SubmitStatusProps {
  contactForm: ContactForm;
  localizedContent: LocalizedContent;
}

export function SubmitStatus({ contactForm, localizedContent }: SubmitStatusProps) {
  const submitResult = useAtomValue(contactForm.submit);

  // Show the permanent feedback message as well
  return AsyncResult.builder(submitResult)
    .onInitialOrWaiting(() => null)
    .onSuccess(() => <InfoLine message={`${localizedContent["contactFormFeedback"]["success"]} → ${localizedContent["contactFormFeedback"]["messageSent"]}`} />)
    .onErrorTag("SchemaError", () => (
      <InfoLine message={`${localizedContent["contactFormFeedback"]["missingFields"]} → ${localizedContent["contactFormFeedback"]["pleaseCorrect"]}`} />
    ))
    .onError(() => (
      <InfoLine message={`${localizedContent["contactFormFeedback"]["serverError"]} → ${localizedContent["contactFormFeedback"]["messageNotSent"]}`} />
    ))
    .onDefect(() => (
      <InfoLine message={`${localizedContent["contactFormFeedback"]["serverError"]} → ${localizedContent["contactFormFeedback"]["messageNotSent"]}`} />
    ))
    .onInterrupt(() => (
      <InfoLine message={`${localizedContent["contactFormFeedback"]["serverError"]} → ${localizedContent["contactFormFeedback"]["messageNotSent"]}`} />
    ))
    .render();
}

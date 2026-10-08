// services, features, and other libraries
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";

// components
import { InfoLine } from "@/ui/info-line";

// types
import type { ContactForm } from "@/features/contact-me/domain";
import type { LocalizedContent } from "@/domain";

interface SubmitStatusProps {
  contactForm: ContactForm;
  localizedContent: LocalizedContent;
}

export function SubmitStatus({ contactForm, localizedContent }: SubmitStatusProps) {
  const submitResult = useAtomValue(contactForm.submit);
  const feedback = localizedContent["contactFormFeedback"];

  // Show the permanent feedback message as well
  return AsyncResult.builder(submitResult)
    .onInitialOrWaiting(() => null)
    .onSuccess(() => <InfoLine message={`${feedback["success"]} → ${feedback["messageSent"]}`} />)
    .onErrorTag("SchemaError", () => <InfoLine message={`${feedback["missingFields"]} → ${feedback["pleaseCorrect"]}`} />)
    .onFailure(() => <InfoLine message={`${feedback["serverError"]} → ${feedback["messageNotSent"]}`} />)
    .render();
}

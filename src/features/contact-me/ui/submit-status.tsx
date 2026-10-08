// services, features, and other libraries
import { useAtomValue } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { AsyncResult } from "effect/reactivity";

// components
import { InfoLine } from "@/ui/info-line";

// types
import type { ContactForm } from "@/features/contact-me/domain";

interface SubmitStatusProps {
  contactForm: ContactForm;
}

// constants
import { UI_COPY } from "@/features/data/domain/ui-copy";

export function SubmitStatus({ contactForm }: SubmitStatusProps) {
  const gt = useGT();
  const submitResult = useAtomValue(contactForm.submit);
  const feedback = UI_COPY.contactFormFeedback;

  // Show the permanent feedback message as well
  return AsyncResult.builder(submitResult)
    .onInitialOrWaiting(() => null)
    .onSuccess(() => <InfoLine message={`${gt(feedback["success"])} → ${gt(feedback["messageSent"])}`} />)
    .onErrorTag("SchemaError", () => <InfoLine message={`${gt(feedback["missingFields"])} → ${gt(feedback["pleaseCorrect"])}`} />)
    .onFailure(() => <InfoLine message={`${gt(feedback["serverError"])} → ${gt(feedback["messageNotSent"])}`} />)
    .render();
}

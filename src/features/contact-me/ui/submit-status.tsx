// services, features, and other libraries
import { useAtomValue } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { AsyncResult } from "effect/reactivity";

// components
import { InfoLine } from "@/ui/info-line";

// types
import type { ContactForm } from "@/features/contact-me/domain/forms";

interface SubmitStatusProps {
  contactForm: ContactForm;
}

export function SubmitStatus({ contactForm }: SubmitStatusProps) {
  const gt = useGT();
  const submitResult = useAtomValue(contactForm.submit);

  // Show the permanent feedback message as well
  return AsyncResult.builder(submitResult)
    .onInitialOrWaiting(() => null)
    .onSuccess(() => <InfoLine message={`${gt("Success!")} → ${gt("Your message has been sent.")}`} />)
    .onErrorTag("SchemaError", () => <InfoLine message={`${gt("Missing fields!")} → ${gt("Please correct the contact form fields and try again.")}`} />)
    .onFailure(() => <InfoLine message={`${gt("Server error!")} → ${gt("The message was not sent successfully; please try again later.")}`} />)
    .render();
}

// tanstack
import { useRouter } from "@tanstack/react-router";

// services, features, and other libraries
import { Option } from "effect";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import { ArrowLeftCircleIcon, PaperAirplaneIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { Loader2 } from "lucide-react";

// types
import type { ContactForm } from "@/features/contact-me/domain";

interface FormSubmitProps {
  contactForm: ContactForm;
}

export function FormSubmit({ contactForm }: FormSubmitProps) {
  const gt = useGT();

  // Get the form context
  const isDirty = useAtomValue(contactForm.isDirty);
  const { waiting } = useAtomValue(contactForm.submit);
  const hasChangedSinceSubmit = useAtomValue(contactForm.hasChangedSinceSubmit);
  const lastSubmittedValues = useAtomValue(contactForm.lastSubmittedValues);
  const reset = useAtomSet(contactForm.reset);

  // To be able to send the user back after canceling
  const router = useRouter();

  // Determine allowance to submit the form
  const hasSubmittedSuccessfully = Option.isSome(lastSubmittedValues);
  const canSubmit = isDirty && !waiting && (hasChangedSinceSubmit || !hasSubmittedSuccessfully);

  return (
    <section className="flex flex-wrap gap-3 *:flex-1 md:gap-6">
      <Button className="button" type="submit" disabled={!canSubmit}>
        {waiting ? <Loader2 className="size-9 animate-spin" /> : <PaperAirplaneIcon className="size-9" />}
        {waiting ? gt("Sending...") : gt("Send")}
      </Button>
      <Button className="button bg-destructive" onClick={() => reset()}>
        <XCircleIcon className="size-9" />
        {gt("Reset")}
      </Button>
      <Button className="button bg-secondary" onClick={() => router.history.back()}>
        <ArrowLeftCircleIcon className="size-9" />
        {gt("Cancel")}
      </Button>
    </section>
  );
}

// tanstack
import { useRouter } from "@tanstack/react-router";

// services, features, and other libraries
import { Option } from "effect";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import ArrowLeftCircleIcon from "@heroicons/react/24/solid/ArrowLeftCircleIcon";
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import PaperAirplaneIcon from "@heroicons/react/24/solid/PaperAirplaneIcon";
import XCircleIcon from "@heroicons/react/24/solid/XCircleIcon";

// types
import type { ContactForm } from "@/features/contact-me/domain/forms";

interface FormSubmitProps {
  form: ContactForm;
}

export function FormSubmit({ form }: FormSubmitProps) {
  const gt = useGT();

  // Subscribe only to the submission-state atoms this component actually reads,
  // so it re-renders independently of the rest of the form; taking the whole form
  // (rather than forwarding each atom as its own prop) keeps ContactForm from
  // needing to know which atoms FormSubmit subscribes to
  const isDirty = useAtomValue(form.isDirty);
  const { waiting } = useAtomValue(form.submit);
  const hasChangedSinceSubmit = useAtomValue(form.hasChangedSinceSubmit);
  const lastSubmittedValues = useAtomValue(form.lastSubmittedValues);
  const reset = useAtomSet(form.reset);

  // To be able to send the user back after canceling
  const router = useRouter();

  // Determine allowance to submit the form
  const hasSubmittedSuccessfully = Option.isSome(lastSubmittedValues);
  const canSubmit = isDirty && !waiting && (hasChangedSinceSubmit || !hasSubmittedSuccessfully);

  return (
    <div className="flex flex-wrap gap-3 *:flex-1 md:gap-6">
      <Button className="button" type="submit" disabled={!canSubmit}>
        {waiting ? (
          // The wrapper carries the spin: CSS transform animations aren't hardware-accelerated on SVG elements, but are on the HTML wrapper
          <span className="inline-flex size-9 animate-spin" aria-hidden="true">
            <ArrowPathIcon className="size-9" />
          </span>
        ) : (
          <PaperAirplaneIcon className="size-9" aria-hidden="true" />
        )}
        {waiting ? gt("Sending...") : gt("Send")}
      </Button>
      <Button className="button bg-destructive" onClick={() => reset()}>
        <XCircleIcon className="size-9" aria-hidden="true" />
        {gt("Reset")}
      </Button>
      <Button className="button bg-secondary" onClick={() => router.history.back()}>
        <ArrowLeftCircleIcon className="size-9" aria-hidden="true" />
        {gt("Cancel")}
      </Button>
    </div>
  );
}

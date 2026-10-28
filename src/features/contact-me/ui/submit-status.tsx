// services, features, and other libraries
import { useAtomValue } from "@effect/atom-react";
import { useGT } from "gt-tanstack-start";
import { AsyncResult } from "effect/reactivity";

// components
import { InfoLine } from "@/ui/info-line";

// types
import type { ContactForm } from "@/features/contact-me/domain/forms";

interface SubmitStatusProps {
  submit: ContactForm["submit"];
}

// constants
import { SUBMIT_FEEDBACK_MESSAGES } from "@/features/contact-me/domain/constants";

export function SubmitStatus({ submit }: SubmitStatusProps) {
  const gt = useGT();
  const submitResult = useAtomValue(submit);

  const { SUCCESS_TITLE, SUCCESS_DESCRIPTION, MISSING_FIELDS_TITLE, MISSING_FIELDS_DESCRIPTION, SERVER_ERROR_TITLE, SERVER_ERROR_DESCRIPTION } =
    SUBMIT_FEEDBACK_MESSAGES(gt);

  // Show the permanent feedback message as well
  return AsyncResult.builder(submitResult)
    .onInitialOrWaiting(() => null)
    .onSuccess(() => <InfoLine message={`${SUCCESS_TITLE} → ${SUCCESS_DESCRIPTION}`} />)
    .onErrorTag("SchemaError", () => <InfoLine message={`${MISSING_FIELDS_TITLE} → ${MISSING_FIELDS_DESCRIPTION}`} />)
    .onFailure(() => <InfoLine message={`${SERVER_ERROR_TITLE} → ${SERVER_ERROR_DESCRIPTION}`} />)
    .render();
}

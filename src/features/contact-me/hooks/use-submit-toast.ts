// services, features, and other libraries
import { Match } from "effect";
import { useGT } from "gt-tanstack-start";
import { useAtomSubscribe } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { toastManager } from "@/ui/toastify";

// types
import type { ContactForm } from "@/features/contact-me/domain/forms";

// constants
import { SUBMIT_FEEDBACK_MESSAGES } from "@/features/contact-me/domain/constants";

// Provide feedback to the user regarding this form actions
export function useSubmitToast(submit: ContactForm["submit"]) {
  const gt = useGT();

  const { SUCCESS_TITLE, SUCCESS_DESCRIPTION, MISSING_FIELDS_TITLE, MISSING_FIELDS_DESCRIPTION, SERVER_ERROR_TITLE, SERVER_ERROR_DESCRIPTION } =
    SUBMIT_FEEDBACK_MESSAGES(gt);

  const toastServerError = () => toastManager.add({ type: "error", title: SERVER_ERROR_TITLE, description: SERVER_ERROR_DESCRIPTION });

  useAtomSubscribe(
    submit,
    (submitResult) =>
      AsyncResult.matchWithWaiting(submitResult, {
        onWaiting: () => {},
        onSuccess: () => {
          toastManager.add({ title: SUCCESS_TITLE, description: SUCCESS_DESCRIPTION });
        },
        onError: (error) =>
          Match.value(error).pipe(
            Match.tag("SchemaError", () => {
              toastManager.add({ type: "error", title: MISSING_FIELDS_TITLE, description: MISSING_FIELDS_DESCRIPTION });
            }),
            Match.orElse(toastServerError)
          ),
        onDefect: toastServerError,
      }),
    { immediate: false }
  );
}

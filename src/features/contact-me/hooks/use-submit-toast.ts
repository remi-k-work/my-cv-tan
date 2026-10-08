// services, features, and other libraries
import { Match } from "effect";
import { useGT } from "gt-tanstack-start";
import { useAtomSubscribe } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { toastManager } from "@/ui/toastify";

// types
import type { ContactForm } from "@/features/contact-me/domain";

// constants
import { UI_COPY } from "@/features/data/domain/ui-copy";

// Provide feedback to the user regarding this form actions
export function useSubmitToast(contactForm: ContactForm) {
  const gt = useGT();
  const feedback = UI_COPY.contactFormFeedback;

  useAtomSubscribe(
    contactForm.submit,
    (submitResult) =>
      AsyncResult.matchWithWaiting(submitResult, {
        onWaiting: () => {},
        onSuccess: () => {
          toastManager.add({ title: gt(feedback.success), description: gt(feedback.messageSent) });
        },
        onError: (error) => {
          Match.value(error).pipe(
            Match.tag("SchemaError", () => {
              toastManager.add({
                type: "error",
                title: gt(feedback.missingFields),
                description: gt(feedback.pleaseCorrect),
              });
            }),
            Match.orElse(() => {
              toastManager.add({
                type: "error",
                title: gt(feedback.serverError),
                description: gt(feedback.messageNotSent),
              });
            })
          );
        },
        onDefect: () => {
          toastManager.add({
            type: "error",
            title: gt(feedback.serverError),
            description: gt(feedback.messageNotSent),
          });
        },
      }),
    { immediate: false }
  );
}

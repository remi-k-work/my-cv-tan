// services, features, and other libraries
import { Match } from "effect";
import { useAtomSubscribe } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { toastManager } from "@/ui/toastify";

// types
import type { ContactForm } from "@/features/contact-me/domain";
import type { LocalizedContent } from "@/domain";

// Provide feedback to the user regarding this form actions
export function useSubmitToast(contactForm: ContactForm, localizedContent: LocalizedContent) {
  useAtomSubscribe(
    contactForm.submit,
    (submitResult) =>
      AsyncResult.matchWithWaiting(submitResult, {
        onWaiting: () => {},
        onSuccess: () => {
          toastManager.add({ title: localizedContent["contactFormFeedback"]["success"], description: localizedContent["contactFormFeedback"]["messageSent"] });
        },
        onError: (error) => {
          Match.value(error).pipe(
            Match.tag("SchemaError", () => {
              toastManager.add({
                type: "error",
                title: localizedContent["contactFormFeedback"]["missingFields"],
                description: localizedContent["contactFormFeedback"]["pleaseCorrect"],
              });
            }),
            Match.orElse(() => {
              toastManager.add({
                type: "error",
                title: localizedContent["contactFormFeedback"]["serverError"],
                description: localizedContent["contactFormFeedback"]["messageNotSent"],
              });
            })
          );
        },
        onDefect: () => {
          toastManager.add({
            type: "error",
            title: localizedContent["contactFormFeedback"]["serverError"],
            description: localizedContent["contactFormFeedback"]["messageNotSent"],
          });
        },
      }),
    { immediate: false }
  );
}

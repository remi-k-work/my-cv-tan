// services, features, and other libraries
import { Match } from "effect";
import { useAtomSubscribe } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";

// components
import { toast } from "sonner";

// types
import type { ContactForm } from "@/features/contact-me/domain";
import type { LocalizedContent } from "@/types/shared";

// Provide feedback to the user regarding this form actions
export function useSubmitToast(contactForm: ContactForm, localizedContent: LocalizedContent) {
  useAtomSubscribe(
    contactForm.submit,
    (submitResult) =>
      AsyncResult.matchWithWaiting(submitResult, {
        onWaiting: () => {},
        onSuccess: () => {
          toast.success(localizedContent["contactFormFeedback"]["success"], { description: localizedContent["contactFormFeedback"]["messageSent"] });
        },
        onError: (error) => {
          Match.value(error).pipe(
            Match.tag("SchemaError", () => {
              toast.warning(localizedContent["contactFormFeedback"]["missingFields"], {
                description: localizedContent["contactFormFeedback"]["pleaseCorrect"],
              });
            }),
            Match.orElse(() => {
              toast.error(localizedContent["contactFormFeedback"]["serverError"], {
                description: localizedContent["contactFormFeedback"]["messageNotSent"],
              });
            })
          );
        },
        onDefect: () => {
          toast.error(localizedContent["contactFormFeedback"]["serverError"], {
            description: localizedContent["contactFormFeedback"]["messageNotSent"],
          });
        },
      }),
    { immediate: false }
  );
}

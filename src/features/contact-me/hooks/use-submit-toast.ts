// services, features, and other libraries
import { Match } from "effect";
import { useGT } from "gt-tanstack-start";
import { useAtomSubscribe } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { toastManager } from "@/ui/toastify";

// types
import type { ContactForm } from "@/features/contact-me/domain/forms";

// Provide feedback to the user regarding this form actions
export function useSubmitToast(contactForm: ContactForm) {
  const gt = useGT();

  const toastServerError = () =>
    toastManager.add({
      type: "error",
      title: gt("Server error!"),
      description: gt("The message was not sent successfully; please try again later."),
    });

  useAtomSubscribe(
    contactForm.submit,
    (submitResult) =>
      AsyncResult.matchWithWaiting(submitResult, {
        onWaiting: () => {},
        onSuccess: () => {
          toastManager.add({ title: gt("Success!"), description: gt("Your message has been sent.") });
        },
        onError: (error) =>
          Match.value(error).pipe(
            Match.tag("SchemaError", () => {
              toastManager.add({
                type: "error",
                title: gt("Missing fields!"),
                description: gt("Please correct the contact form fields and try again."),
              });
            }),
            Match.orElse(toastServerError)
          ),
        onDefect: toastServerError,
      }),
    { immediate: false }
  );
}

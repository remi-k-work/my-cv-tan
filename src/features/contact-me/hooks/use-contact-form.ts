// react
import { useMemo } from "react";

// services, features, and other libraries
import { useAtomSet } from "@effect/atom-react";
import { contactForm } from "@/features/contact-me/domain/forms";
import { useSubmitToast } from "@/features/contact-me/hooks/use-submit-toast";

// types
import type { SubmitEvent } from "react";

// Encapsulates the contact form's lifecycle: one isolated form instance per hook call,
// the submit atom, and the toast-feedback subscription; returns the form and the
// submission handler so the presentational component stays focused on rendering
export function useContactForm() {
  // One form instance per component instance (not shared at module scope), so each
  // SSR request and each client mount gets isolated form state; stable across re-renders
  const form = useMemo(() => contactForm(), []);

  // Get the form context
  const submit = useAtomSet(form.submit);

  // Provide feedback to the user regarding this form actions
  useSubmitToast(form.submit);

  function handleSubmitted(ev: SubmitEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    submit();
  }

  return { form, handleSubmitted } as const;
}

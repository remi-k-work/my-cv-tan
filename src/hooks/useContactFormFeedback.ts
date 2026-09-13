// react
import { useEffect } from "react";

// components
import { toast } from "sonner";

// types
import type { ContactFormActionResult } from "@/actions/contactForm";
import type { LocalizedContent } from "@/types/shared";

// Provide feedback to the user regarding contact form actions
export default function useContactFormFeedback(formState: ContactFormActionResult, localizedContent: LocalizedContent, reset: () => void) {
  useEffect(() => {
    const { actionStatus } = formState;

    if (actionStatus === "succeeded") {
      toast.success(localizedContent["contactFormFeedback"]["success"], { description: localizedContent["contactFormFeedback"]["messageSent"] });

      // Reset the entire form after successful submission
      reset();
    } else if (actionStatus === "invalid") {
      toast.warning(localizedContent["contactFormFeedback"]["missingFields"], { description: localizedContent["contactFormFeedback"]["pleaseCorrect"] });
    } else if (actionStatus === "failed") {
      toast.error(localizedContent["contactFormFeedback"]["serverError"], { description: localizedContent["contactFormFeedback"]["messageNotSent"] });
    } else if (actionStatus === "invalid-captcha") {
      toast.warning(localizedContent["contactFormFeedback"]["missingFields"], { description: localizedContent["contactFormFeedback"]["invalidCaptcha"] });
    }
  }, [formState, localizedContent, reset]);
}

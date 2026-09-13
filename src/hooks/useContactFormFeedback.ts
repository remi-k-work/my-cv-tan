import { useEffect } from "react";

import { toast } from "sonner";

import type { ContactFormResult } from "@/server/contact.functions";
import type { LocalizedContent } from "@/types/shared";

export default function useContactFormFeedback(formState: ContactFormResult, localizedContent: LocalizedContent, reset: () => void) {
  useEffect(() => {
    const { actionStatus } = formState;

    if (actionStatus === "succeeded") {
      toast.success(localizedContent["contactFormFeedback"]["success"], { description: localizedContent["contactFormFeedback"]["messageSent"] });
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

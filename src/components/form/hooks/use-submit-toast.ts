// services, features, and other libraries
import { Cause, Option } from "effect";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";

// components
import { toast } from "sonner";

// types
import type { Field } from "@lucas-barake/effect-form-react";
import type { BuiltForm } from "@lucas-barake/effect-form-react/FormReact";
import type { LocalizedContent } from "@/types/shared";

// Provide feedback to the user regarding this form actions
export function useSubmitToast<TFields extends Field.FieldsRecord, R, A, E, SubmitArgs>(
  form: BuiltForm<TFields, R, A, E, SubmitArgs>,
  localizedContent: LocalizedContent
) {
  const submitResult = useAtomValue(form.submit);

  AsyncResult.matchWithError(submitResult, {
    onInitial: () => {},
    onSuccess: () => {
      toast.success(localizedContent["contactFormFeedback"]["success"], {
        id: "SUCCESS!",
        description: localizedContent["contactFormFeedback"]["messageSent"],
      });
    },
    onError: (error: unknown) => {
      console.log(error);
    },
    onDefect: () => {
      console.log("defect");
    },
  });
}

// react
import { useEffect, useState } from "react";

// next
import { useRouter } from "next/navigation";

// services, features, and other libraries
import { Duration, Option } from "effect";
import { Result, useAtomSet, useAtomSubscribe, useAtomValue } from "@effect-atom/atom-react";

// components
import { Button } from "@/components/ui/custom/button";

// assets
import { ArrowLeftCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";

// types
import type { Field } from "@lucas-barake/effect-form-react";
import type { BuiltForm } from "@lucas-barake/effect-form-react/FormReact";
import type { DurationInput } from "effect/Duration";
import type { ReactNode } from "react";

interface FormSubmitProps<TFields extends Field.FieldsRecord, R, A, E, SubmitArgs> {
  form: BuiltForm<TFields, R, A, E, SubmitArgs>;
  submitIcon: ReactNode;
  submitText: string;
  resetText?: string;
  cancelText?: string;
  showReset?: boolean;
  showCancel?: boolean;
  isStateless?: boolean;
  cooldown?: DurationInput;
  onClearedForm?: () => void;
}

export function FormSubmit<TFields extends Field.FieldsRecord, R, A, E, SubmitArgs>({
  form,
  submitIcon,
  submitText,
  resetText = "Clear Form",
  cancelText = "Cancel and Go Back",
  showReset = true,
  showCancel = true,
  isStateless = false,
  cooldown = 0,
  onClearedForm,
}: FormSubmitProps<TFields, R, A, E, SubmitArgs>) {
  // Get the form context
  const isDirty = useAtomValue(form.isDirty);
  const { waiting } = useAtomValue(form.submit);
  const hasChangedSinceSubmit = useAtomValue(form.hasChangedSinceSubmit);
  const lastSubmittedValues = useAtomValue(form.lastSubmittedValues);
  const reset = useAtomSet(form.reset);

  // To be able to send the user back after canceling
  const { back } = useRouter();

  // Add a simple cooling down state
  const [isCoolingDown, setIsCoolingDown] = useState(false);

  // Decode the duration safely once (handles numbers, "9 seconds", "1 millis", etc.)
  const cooldownMillis = Duration.toMillis(Duration.decode(cooldown));

  // Begin the cooldown only after the form has been successfully submitted
  useAtomSubscribe(
    form.submit,
    (result) => {
      if (Result.isSuccess(result)) {
        // Make sure the cooldown duration has been actually requested
        if (cooldownMillis > 0) setIsCoolingDown(true);
      }
    },
    { immediate: false }
  );

  // Reset the cooling down state
  useEffect(() => {
    if (isCoolingDown) {
      const timer = setTimeout(() => setIsCoolingDown(false), cooldownMillis);
      return () => clearTimeout(timer);
    }
  }, [isCoolingDown, cooldownMillis]);

  // Determine allowance to submit the form
  const hasSubmittedSuccessfully = Option.isSome(lastSubmittedValues);
  const canSubmit = isStateless ? !waiting && !isCoolingDown : isDirty && !waiting && !isCoolingDown && (hasChangedSinceSubmit || !hasSubmittedSuccessfully);

  return (
    <section className="flex flex-wrap gap-3 *:flex-1 md:gap-6">
      <Button type="submit" disabled={!canSubmit}>
        {waiting ? <Loader2 className="size-9 animate-spin" /> : <>{submitIcon}</>}
        {submitText}
      </Button>
      {showReset && (
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            reset();
            onClearedForm?.();
          }}
        >
          <XCircleIcon className="size-9" />
          {resetText}
        </Button>
      )}
      {showCancel && (
        <Button type="button" variant="secondary" onClick={() => back()}>
          <ArrowLeftCircleIcon className="size-9" />
          {cancelText}
        </Button>
      )}
    </section>
  );
}

export function FormSubmitSkeleton<TFields extends Field.FieldsRecord, R, A, E, SubmitArgs>({
  submitIcon,
  submitText,
  resetText = "Clear Form",
  cancelText = "Cancel and Go Back",
  showReset = true,
  showCancel = true,
}: Omit<FormSubmitProps<TFields, R, A, E, SubmitArgs>, "form">) {
  return (
    <section className="flex flex-wrap gap-3 *:flex-1 md:gap-6">
      <Button type="submit" disabled>
        {submitIcon}
        {submitText}
      </Button>
      {showReset && (
        <Button type="button" variant="destructive" disabled>
          <XCircleIcon className="size-9" />
          {resetText}
        </Button>
      )}
      {showCancel && (
        <Button type="button" variant="secondary" disabled>
          <ArrowLeftCircleIcon className="size-9" />
          {cancelText}
        </Button>
      )}
    </section>
  );
}

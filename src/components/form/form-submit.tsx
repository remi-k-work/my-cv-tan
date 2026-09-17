// tanstack
import { useRouter } from "@tanstack/react-router";

// services, features, and other libraries
import { Option } from "effect";
import { useAtomSet, useAtomValue } from "@effect/atom-react";

// components
import { Button } from "@base-ui/react";

// assets
import { HandThumbDownIcon, HandThumbUpIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { Loader2 } from "lucide-react";

// types
import type { Field } from "@lucas-barake/effect-form-react";
import type { BuiltForm } from "@lucas-barake/effect-form-react/FormReact";
import type { LocalizedContent } from "@/types/shared";

interface FormSubmitProps<TFields extends Field.FieldsRecord, R, A, E, SubmitArgs> {
  form: BuiltForm<TFields, R, A, E, SubmitArgs>;
  localizedContent: LocalizedContent;
}

export function FormSubmit<TFields extends Field.FieldsRecord, R, A, E, SubmitArgs>({ form, localizedContent }: FormSubmitProps<TFields, R, A, E, SubmitArgs>) {
  // Get the form context
  const isDirty = useAtomValue(form.isDirty);
  const { waiting } = useAtomValue(form.submit);
  const hasChangedSinceSubmit = useAtomValue(form.hasChangedSinceSubmit);
  const lastSubmittedValues = useAtomValue(form.lastSubmittedValues);
  const reset = useAtomSet(form.reset);

  // To be able to send the user back after canceling
  const router = useRouter();

  // Determine allowance to submit the form
  const hasSubmittedSuccessfully = Option.isSome(lastSubmittedValues);
  const canSubmit = isDirty && !waiting && (hasChangedSinceSubmit || !hasSubmittedSuccessfully);

  return (
    <section className="flex flex-wrap gap-3 *:flex-1 md:gap-6">
      <Button className="button" type="submit" disabled={!canSubmit}>
        {waiting ? <Loader2 className="size-9 animate-spin" /> : <HandThumbUpIcon className="size-9" />}
        {waiting ? localizedContent["formSubmit"]["sending"] : localizedContent["formSubmit"]["send"]}
      </Button>
      <Button className="button border-destructive-foreground text-destructive-foreground hover:shadow-destructive-foreground" onClick={() => reset()}>
        <XCircleIcon className="size-9" />
        {localizedContent["formSubmit"]["reset"]}
      </Button>
      <Button className="button border-secondary-foreground text-secondary-foreground hover:shadow-secondary-foreground" onClick={() => router.history.back()}>
        <HandThumbDownIcon className="size-9" />
        {localizedContent["formSubmit"]["cancel"]}
      </Button>
    </section>
  );
}

export function FormSubmitSkeleton() {
  return (
    <section className="flex flex-wrap gap-3 *:flex-1 md:gap-6">
      <Button className="button" type="submit" disabled>
        <HandThumbUpIcon className="size-9" />
        &nbsp;
      </Button>
      <Button className="button border-destructive-foreground text-destructive-foreground hover:shadow-destructive-foreground" disabled>
        <XCircleIcon className="size-9" />
        &nbsp;
      </Button>
      <Button className="button border-secondary-foreground text-secondary-foreground hover:shadow-secondary-foreground" disabled>
        <HandThumbDownIcon className="size-9" />
        &nbsp;
      </Button>
    </section>
  );
}

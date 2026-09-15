// tanstack
import { useRouter } from "@tanstack/react-router";

// services, features, and other libraries
import { useFormContext } from ".";

// components
import { Button } from "@base-ui/react";

// assets
import { HandThumbDownIcon, HandThumbUpIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { Loader2 } from "lucide-react";

// types
import type { LocalizedContent } from "@/types/shared";

interface FormSubmitProps {
  localizedContent: LocalizedContent;
  isPending: boolean;
}

export default function FormSubmit({ localizedContent, isPending }: FormSubmitProps) {
  // Get the form context
  const { Subscribe, reset } = useFormContext();

  // To be able to send the user back after canceling
  const router = useRouter();

  return (
    <section className="flex w-full flex-wrap items-center justify-around gap-6">
      <Subscribe selector={(formState) => [formState.canSubmit, formState.isSubmitting, formState.isPristine]}>
        {([canSubmit, isSubmitting, isPristine]) => (
          <Button className="button" type="submit" disabled={isPending || !canSubmit || isPristine}>
            {isPending || isSubmitting ? (
              <>
                <Loader2 className="size-9 animate-spin" />
                {localizedContent["formSubmit"]["sending"]}
              </>
            ) : (
              <>
                <HandThumbUpIcon className="size-9" />
                {localizedContent["formSubmit"]["send"]}
              </>
            )}
          </Button>
        )}
      </Subscribe>
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

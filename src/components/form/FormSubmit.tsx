import { useRouter } from "@tanstack/react-router";

import { useFormContext } from ".";

import { Button } from "@/components/ui/custom/button";

import { HandThumbDownIcon, HandThumbUpIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { Loader2 } from "lucide-react";

import type { LocalizedContent } from "@/types/shared";

interface FormSubmitProps {
  localizedContent: LocalizedContent;
  isPending: boolean;
}

export default function FormSubmit({ localizedContent, isPending }: FormSubmitProps) {
  const { Subscribe, reset } = useFormContext();

  const router = useRouter();

  return (
    <section className="flex w-full flex-wrap items-center justify-around gap-6">
      <Subscribe selector={(formState) => [formState.canSubmit, formState.isSubmitting, formState.isPristine]}>
        {([canSubmit, isSubmitting, isPristine]) => (
          <Button type="submit" disabled={isPending || !canSubmit || isPristine}>
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
      <Button type="button" variant="destructive" onClick={() => reset()}>
        <XCircleIcon className="size-9" />
        {localizedContent["formSubmit"]["reset"]}
      </Button>
      <Button type="button" variant="secondary" onClick={() => router.history.back()}>
        <HandThumbDownIcon className="size-9" />
        {localizedContent["formSubmit"]["cancel"]}
      </Button>
    </section>
  );
}

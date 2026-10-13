// oxlint-disable effecttsgo/async-function

// react
import { useTransition } from "react";

// tanstack
import { useRouter } from "@tanstack/react-router";

// services, features, and other libraries
import { useGT, useLocale, useSetLocale } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import { PlFlagIcon, UsFlagIcon } from "@/assets/icons";

export function LangChanger() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const gt = useGT();

  // To display a pending status while the server action is running
  const [isPending, startTransition] = useTransition();

  // To be able to refresh the page
  const router = useRouter();

  function handleLangToggled() {
    startTransition(async () => {
      setLocale(locale === "en" ? "pl" : "en");
      await router.invalidate();
    });
  }

  return (
    <Button
      className="button animate-rise [animation-delay:0.64s]"
      disabled={isPending}
      title={gt(locale === "en" ? "English" : "Polish")}
      onClick={handleLangToggled}
    >
      {locale === "en" ? <UsFlagIcon className="size-11" /> : <PlFlagIcon className="size-11" />}
    </Button>
  );
}

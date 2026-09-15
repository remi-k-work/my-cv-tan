// react
import { useTransition } from "react";

// tanstack
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

// services, features, and other libraries
import { setLangCookie } from "@/server/lang.functions";

// components
import { Button } from "@base-ui/react";

// assets
import UsFlagIcon from "@/assets/icons/UsFlag";
import PlFlagIcon from "@/assets/icons/PlFlag";

// types
import type { Lang } from "@/types/shared";

interface LangChangerProps {
  preferredLang: Lang;
}

export default function LangChanger({ preferredLang }: LangChangerProps) {
  // To display a pending status while the server action is running
  const [isPending, startTransition] = useTransition();

  // To be able to refresh the page
  const router = useRouter();

  const setLang = useServerFn(setLangCookie);

  function handleLangToggled() {
    startTransition(async () => {
      await setLang({ data: preferredLang === "en" ? "pl" : "en" });
      await router.invalidate();
    });
  }

  return (
    <Button className="button" disabled={isPending} title={preferredLang === "en" ? "English" : "Polish"} onClick={handleLangToggled}>
      {preferredLang && (preferredLang === "en" ? <UsFlagIcon className="size-11" /> : <PlFlagIcon className="size-11" />)}
    </Button>
  );
}

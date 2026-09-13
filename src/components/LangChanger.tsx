import { useTransition } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { setLangCookie } from "@/server/lang.functions";

import { Button } from "@/components/ui/custom/button";

import UsFlagIcon from "@/assets/icons/UsFlag";
import PlFlagIcon from "@/assets/icons/PlFlag";

import type { Lang } from "@/types/shared";

interface LangChangerProps {
  preferredLang: Lang;
}

export default function LangChanger({ preferredLang }: LangChangerProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const setLang = useServerFn(setLangCookie);

  function handleLangToggled() {
    startTransition(async () => {
      await setLang({ data: preferredLang === "en" ? "pl" : "en" });
      await router.invalidate();
    });
  }

  return (
    <Button type="button" disabled={isPending} title={preferredLang === "en" ? "English" : "Polish"} onClick={handleLangToggled}>
      {preferredLang && (preferredLang === "en" ? <UsFlagIcon className="size-11" /> : <PlFlagIcon className="size-11" />)}
    </Button>
  );
}

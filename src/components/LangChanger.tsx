"use client";

// react
import { useTransition } from "react";

// next
import { useRouter } from "next/navigation";

// server actions and mutations
import { setLangCookie } from "@/actions/langChanger";

// components
import { Button } from "@/components/ui/custom/button";

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
  const { refresh } = useRouter();

  function handleLangToggled() {
    startTransition(async () => {
      await setLangCookie(preferredLang === "en" ? "pl" : "en");
      refresh();
    });
  }

  return (
    <Button type="button" disabled={isPending} title={preferredLang === "en" ? "English" : "Polish"} onClick={handleLangToggled}>
      {preferredLang && (preferredLang === "en" ? <UsFlagIcon className="size-11" /> : <PlFlagIcon className="size-11" />)}
    </Button>
  );
}

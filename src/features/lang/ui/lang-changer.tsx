// react
import { useTransition } from "react";

// tanstack
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

// services, features, and other libraries
import { useAtomSet } from "@effect/atom-react";
import { updateAtom } from "@/features/lang/state";
import { setLangCookie } from "@/server/lang.functions";

// components
import { Button } from "@base-ui/react";

// assets
import UsFlagIcon from "@/assets/icons/UsFlag";
import PlFlagIcon from "@/assets/icons/PlFlag";

// types
import type { PreferredLanguage } from "@/domain";

interface LangChangerProps {
  preferredLanguage: PreferredLanguage;
}

export default function LangChanger({ preferredLanguage }: LangChangerProps) {
  const update = useAtomSet(updateAtom, { mode: "promise" });

  // To display a pending status while the server action is running
  const [isPending, startTransition] = useTransition();

  // To be able to refresh the page
  const router = useRouter();

  const setLang = useServerFn(setLangCookie);

  function handleLangToggled() {
    startTransition(async () => {
      // await setLang({ data: preferredLanguage === "en" ? "pl" : "en" });
      await update("en");
      await router.invalidate();
    });
  }

  return (
    <Button className="button" disabled={isPending} title={preferredLanguage === "en" ? "English" : "Polish"} onClick={handleLangToggled}>
      {preferredLanguage && (preferredLanguage === "en" ? <UsFlagIcon className="size-11" /> : <PlFlagIcon className="size-11" />)}
    </Button>
  );
}

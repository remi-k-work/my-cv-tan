// oxlint-disable effecttsgo/async-function

// react
import { useTransition } from "react";

// tanstack
import { useRouter } from "@tanstack/react-router";

// services, features, and other libraries
import { useAtomSet } from "@effect/atom-react";
import { updateAtom } from "@/features/data/state";
import { matchPreferredLanguage } from "@/domain";

// components
import { Button } from "@base-ui/react";

// assets
import { PlFlagIcon, UsFlagIcon } from "@/assets/icons";

// types
import type { PreferredLanguage } from "@/domain";

interface LangChangerProps {
  preferredLanguage: PreferredLanguage;
}

export function LangChanger({ preferredLanguage }: LangChangerProps) {
  const update = useAtomSet(updateAtom, { mode: "promise" });

  // To display a pending status while the server action is running
  const [isPending, startTransition] = useTransition();

  // To be able to refresh the page
  const router = useRouter();

  function handleLangToggled() {
    startTransition(async () => {
      await update(matchPreferredLanguage(preferredLanguage, "pl", "en"));
      await router.invalidate();
    });
  }

  return (
    <Button className="button" disabled={isPending} title={preferredLanguage === "en" ? "English" : "Polish"} onClick={handleLangToggled}>
      {preferredLanguage === "en" ? <UsFlagIcon className="size-11" /> : <PlFlagIcon className="size-11" />}
    </Button>
  );
}

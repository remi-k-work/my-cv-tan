// oxlint-disable effecttsgo/async-function

// react
import { useTransition } from "react";

// tanstack
import { useRouter } from "@tanstack/react-router";

// services, features, and other libraries
import { useGT, useLocale, useSetLocale } from "gt-tanstack-start";
import { AnimatePresence, motion } from "motion/react";

// components
import { Button } from "@base-ui/react";

// assets
import { PlFlagIcon, UsFlagIcon } from "@/assets/icons";

// constants
import { SPRINGS } from "@/lib/motion-tokens";

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
      className="button animate-rise [animation-delay:0.64s] perspective-distant"
      disabled={isPending}
      title={gt(locale === "en" ? "Switch to Polish" : "Switch to English")}
      aria-label={gt(locale === "en" ? "Switch to Polish" : "Switch to English")}
      onClick={handleLangToggled}
    >
      {/* The flag flips over to the other language instead of swapping out from under the pointer;
          `initial={false}` keeps the server markup (and the hydration render) free of any rotation */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={locale}
          aria-hidden="true"
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0 }}
          transition={SPRINGS.snappy}
        >
          {locale === "en" ? <UsFlagIcon className="size-11" /> : <PlFlagIcon className="size-11" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}

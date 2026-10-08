// react
import { useState } from "react";

// services, features, and other libraries
import { DateTime } from "effect";
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import { ArrowPathIcon } from "@heroicons/react/24/solid";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/captcha/domain";
import { LANGUAGE_NAMES, UI_COPY } from "@/features/data/domain/ui-copy";

export function Captcha() {
  const gt = useGT();
  const [captchaSrc, setCaptchaSrc] = useState("/api/captcha");

  return (
    <article className="flex items-center justify-center gap-3">
      <img className="rounded" src={captchaSrc} width={CAPTCHA_WIDTH} height={CAPTCHA_HEIGHT} alt={gt(UI_COPY.contactForm.labelCaptcha)} />
      <Button
        className="button"
        aria-label={gt(LANGUAGE_NAMES.refreshCaptcha)}
        onClick={() => setCaptchaSrc(`/api/captcha?t=${DateTime.nowUnsafe().epochMilliseconds}`)}
      >
        <ArrowPathIcon className="size-9" />
      </Button>
    </article>
  );
}

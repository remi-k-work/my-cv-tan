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

export function Captcha() {
  const gt = useGT();
  const [captchaSrc, setCaptchaSrc] = useState("/api/captcha");

  return (
    <div className="flex items-center justify-center gap-3">
      <img className="rounded" src={captchaSrc} width={CAPTCHA_WIDTH} height={CAPTCHA_HEIGHT} alt={gt("Captcha")} />
      <Button className="button" aria-label={gt("Refresh CAPTCHA")} onClick={() => setCaptchaSrc(`/api/captcha?t=${DateTime.nowUnsafe().epochMilliseconds}`)}>
        {/* Keyed by the captcha source, so the icon remounts and spins once whenever a fresh captcha is fetched */}
        <ArrowPathIcon key={captchaSrc} className="size-9 animate-spin-once" aria-hidden="true" />
      </Button>
    </div>
  );
}

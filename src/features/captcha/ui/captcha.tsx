// react
import { useState } from "react";

// services, features, and other libraries
import { DateTime } from "effect";

// components
import { Button } from "@base-ui/react";

// assets
import { ArrowPathIcon } from "@heroicons/react/24/solid";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/captcha/domain";

export function Captcha() {
  const [captchaSrc, setCaptchaSrc] = useState("/api/captcha");

  return (
    <article className="flex items-center justify-center gap-3">
      <img className="rounded" src={captchaSrc} width={CAPTCHA_WIDTH} height={CAPTCHA_HEIGHT} alt="Captcha" />
      <Button className="button" onClick={() => setCaptchaSrc(`/api/captcha?t=${DateTime.nowUnsafe().epochMilliseconds}`)}>
        <ArrowPathIcon className="size-9" />
      </Button>
    </article>
  );
}

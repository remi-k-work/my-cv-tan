// react
import { useState } from "react";

// services, features, and other libraries
import { useGT } from "gt-tanstack-start";

// components
import { Button } from "@base-ui/react";

// assets
import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/captcha/domain/constants";

export function Captcha() {
  const gt = useGT();
  const [nonce, setNonce] = useState(0);
  const captchaSrc = `/api/captcha?r=${nonce}`;

  return (
    <div className="flex items-center justify-center gap-3">
      <img className="rounded" src={captchaSrc} width={CAPTCHA_WIDTH} height={CAPTCHA_HEIGHT} alt={gt("Captcha")} />
      <Button className="button" aria-label={gt("Refresh CAPTCHA")} onClick={() => setNonce((current) => current + 1)}>
        <span key={nonce} className="inline-flex size-9 animate-spin-once" aria-hidden="true">
          <ArrowPathIcon className="size-9" />
        </span>
      </Button>
    </div>
  );
}

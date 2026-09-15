// react
import { useEffect, useState } from "react";

// services, features, and other libraries
import PathFinder from "@/lib/PathFinder";

// components
import { Button } from "@/components/ui/custom/button";

// assets
import { ArrowPathIcon } from "@heroicons/react/24/solid";

// types
interface CaptchaProps {
  captchaName: string;
}

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/auth/captcha";

export default function Captcha({ captchaName }: CaptchaProps) {
  const [captchaSrc, setCaptchaSrc] = useState(PathFinder.toCaptcha(captchaName));

  useEffect(() => {
    setCaptchaSrc(PathFinder.toCaptcha(captchaName, true));
  }, [captchaName]);

  return (
    <article className="flex items-center justify-center gap-3">
      <img src={captchaSrc} width={CAPTCHA_WIDTH} height={CAPTCHA_HEIGHT} alt={captchaName} className="rounded" />
      <Button type="button" onClick={() => setCaptchaSrc(PathFinder.toCaptcha(captchaName, true))}>
        <ArrowPathIcon className="size-9" />
      </Button>
    </article>
  );
}

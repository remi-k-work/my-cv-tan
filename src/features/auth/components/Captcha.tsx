import { useEffect, useState } from "react";

import PathFinder from "@/lib/PathFinder";
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/auth/captcha";

import { Button } from "@/components/ui/custom/button";

import { ArrowPathIcon } from "@heroicons/react/24/solid";

interface CaptchaProps {
  captchaName: string;
}

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

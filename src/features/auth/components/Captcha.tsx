"use client";

// react
import { useEffect, useState } from "react";

// next
import Image from "next/image";

// other libraries
import PathFinder from "@/lib/PathFinder";
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/auth/components/CaptchaBackground";

// components
import { Button } from "@/components/ui/custom/button";

// assets
import { ArrowPathIcon } from "@heroicons/react/24/solid";

// types
interface CaptchaProps {
  captchaName: string;
}

export default function Captcha({ captchaName }: CaptchaProps) {
  const [captchaSrc, setCaptchaSrc] = useState(PathFinder.toCaptcha(captchaName));

  useEffect(() => {
    // Always reload the captcha to ensure that the browser does not display the cached version
    setCaptchaSrc(PathFinder.toCaptcha(captchaName, true));
  }, [captchaName]);

  return (
    <article className="flex items-center justify-center gap-3">
      <Image src={captchaSrc} overrideSrc={captchaSrc} width={CAPTCHA_WIDTH} height={CAPTCHA_HEIGHT} alt={captchaName} unoptimized className="rounded" />
      <Button type="button" onClick={() => setCaptchaSrc(PathFinder.toCaptcha(captchaName, true))}>
        <ArrowPathIcon className="size-9" />
      </Button>
    </article>
  );
}

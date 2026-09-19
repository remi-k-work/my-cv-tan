// services, features, and other libraries
import { Context, Effect, Layer, Random } from "effect";
import { createCaptchaSvg, getCaptchaSession, setCaptchaSession } from "@/features/captcha/domain";

// constants
import { PERMITTED_CHARS, STRENGTH } from "@/features/captcha/domain";

export class Captcha extends Context.Service<Captcha>()("Captcha", {
  make: Effect.sync(() => {
    const getCaptchaString = Effect.promise(() => getCaptchaSession());
    const setCaptchaString = Effect.fn("setCaptchaString")((captchaString: string) => Effect.promise(() => setCaptchaSession({ data: { captchaString } })));
    const createNewCaptcha = Effect.gen(function* () {
      let captchaString = "";
      for (let i = 0; i < STRENGTH; i++) captchaString += PERMITTED_CHARS[yield* Random.nextIntBetween(0, PERMITTED_CHARS.length - 1)];

      yield* setCaptchaString(captchaString);
      return new Response(yield* createCaptchaSvg(captchaString), { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, no-store" } });
    });

    return { getCaptchaString, createNewCaptcha } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

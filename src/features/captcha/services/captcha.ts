// services, features, and other libraries
import { Context, Effect, Layer, Random } from "effect";
import { sealCaptchaString, unsealCaptchaString } from "@/features/captcha/domain";

// constants
import { PERMITTED_CHARS, STRENGTH } from "@/features/captcha/domain";

export class Captcha extends Context.Service<Captcha>()("Captcha", {
  make: Effect.sync(() => {
    const generateCaptchaString = Effect.gen(function* () {
      let captchaString = "";
      for (let i = 0; i < STRENGTH; i++) captchaString += PERMITTED_CHARS[yield* Random.nextIntBetween(0, PERMITTED_CHARS.length - 1)];
      return captchaString;
    });

    return { generateCaptchaString, sealCaptchaString, unsealCaptchaString } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

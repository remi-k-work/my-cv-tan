// services, features, and other libraries
import { Context, Effect, Layer, Random } from "effect";
import { getCaptchaSession, randomBackground, renderLetters, setCaptchaSession } from "@/features/captcha/domain";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH, PERMITTED_CHARS, STRENGTH } from "@/features/captcha/domain";

export class Captcha extends Context.Service<Captcha>()("Captcha", {
  make: Effect.succeed(() => {
    const getCaptchaString = Effect.promise(() => getCaptchaSession());
    const setCaptchaString = Effect.fn("setCaptchaString")((captchaString: string) => Effect.promise(() => setCaptchaSession({ data: { captchaString } })));
    const createNewCaptcha = Effect.gen(function* () {
      let captchaString = "";
      for (let i = 0; i < STRENGTH; i++) captchaString += PERMITTED_CHARS[yield* Random.nextIntBetween(0, PERMITTED_CHARS.length - 1)];

      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" viewBox="0 0 ${CAPTCHA_WIDTH} ${CAPTCHA_HEIGHT}">` +
        `${yield* randomBackground}${yield* renderLetters(captchaString)}</svg>`;

      yield* setCaptchaString(captchaString);

      return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, no-store" } });
    });

    return { getCaptchaString, createNewCaptcha } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

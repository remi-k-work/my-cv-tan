// tanstack
import { useSession } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Config, Context, Effect, Layer, Redacted } from "effect";

// types
interface CaptchaSession {
  captchaString?: string;
}

const useCaptchaSession = Effect.gen(function* () {
  const password = yield* Config.Redacted("SESSION_SECRET");
  const secure = yield* Config.String("NODE_ENV").pipe(Config.map((env) => env === "production"));

  return yield* Effect.promise(() =>
    useSession<CaptchaSession>({ name: "captcha", password: Redacted.value(password), cookie: { secure, sameSite: "lax", httpOnly: true } })
  );
});

export class Captcha extends Context.Service<Captcha>()("Captcha", {
  make: Effect.gen(function* () {
    const captchaSession = yield* useCaptchaSession;

    const getCaptchaString = captchaSession.data.captchaString;
    const setCaptchaString = (captchaString: string) => Effect.promise(() => captchaSession.update({ captchaString }));

    return { getCaptchaString, setCaptchaString } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

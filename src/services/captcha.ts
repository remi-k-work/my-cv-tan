import "@tanstack/react-start/server-only";

// tanstack
import { createServerOnlyFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

// services, features, and other libraries
import { Config, Context, Effect, Layer, Redacted } from "effect";

// types
interface CaptchaSession {
  captchaString?: string;
}

const useCaptchaSession = createServerOnlyFn(() =>
  Effect.gen(function* () {
    const password = yield* Config.Redacted("SESSION_SECRET");
    const env = yield* Config.Literal("local", "ENV").pipe(Config.orElse(() => Config.succeed("prod" as const)));
    const secure = env === "prod";

    return yield* Effect.promise(() =>
      useSession<CaptchaSession>({ name: "captcha", password: Redacted.value(password), cookie: { secure, sameSite: "lax", httpOnly: true } })
    );
  }).pipe(Effect.tapCause(Effect.logError))
);

export class Captcha extends Context.Service<Captcha>()("Captcha", {
  make: Effect.gen(function* () {
    const captchaSession = yield* useCaptchaSession();

    const getCaptchaString = captchaSession.data.captchaString;
    const setCaptchaString = (captchaString: string) => Effect.promise(() => captchaSession.update({ captchaString }));

    return { getCaptchaString, setCaptchaString } as const;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make);
}

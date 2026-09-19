// oxlint-disable effecttsgo/async-function effecttsgo/process-env

// tanstack
import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

// types
import type { CaptchaSession } from ".";

export const getCaptchaSession = createServerFn({ method: "GET" }).handler(
  async () =>
    (
      await useSession<CaptchaSession>({
        name: "captcha",
        password: process.env.SESSION_SECRET as string,
        cookie: { secure: process.env.NODE_ENV === "production", sameSite: "lax", httpOnly: true },
      })
    ).data.captchaString
);

export const setCaptchaSession = createServerFn({ method: "GET" })
  .validator((data: { captchaString: string }) => data)
  .handler(async ({ data: { captchaString } }) => {
    await (
      await useSession<CaptchaSession>({
        name: "captcha",
        password: process.env.SESSION_SECRET as string,
        cookie: { secure: process.env.NODE_ENV === "production", sameSite: "lax", httpOnly: true },
      })
    ).update({ captchaString });
  });

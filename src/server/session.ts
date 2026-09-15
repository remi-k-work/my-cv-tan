// tanstack
import { useSession } from "@tanstack/react-start/server";

// types
export interface CaptchaSession {
  captchaString?: string;
}

export function useCaptchaSession(cookieName: string) {
  return useSession<CaptchaSession>({
    name: cookieName,
    password: process.env.SESSION_SECRET as string,
    cookie: { secure: process.env.NODE_ENV === "production", sameSite: "lax", httpOnly: true },
  });
}

// oxlint-disable effecttsgo/process-env

// types
import type { Cookies } from "effect/unstable/http";

// constants
export const LANG_COOKIE_NAME = "lang";

export const LANG_COOKIE_OPTIONS = {
  maxAge: 2592000,
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const satisfies Cookies.Cookie["options"];

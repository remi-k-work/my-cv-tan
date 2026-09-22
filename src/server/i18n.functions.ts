// tanstack
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";

// services, features, and other libraries
import { resolveLang } from "@/lib/DataLoader";

// types
import type { PreferredLanguage } from "@/domain";

// constants
import { LANG_COOKIE } from "@/lib/DataLoader";

export const getLang = createServerFn({ method: "GET" }).handler(async (): Promise<PreferredLanguage> => {
  const langCookie = getCookie(LANG_COOKIE);
  const acceptLanguage = getRequestHeader("accept-language");
  return resolveLang(typeof langCookie === "string" ? langCookie : null, acceptLanguage ?? null);
});

import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";
import { LANG_COOKIE, resolveLang } from "@/lib/DataLoader";
import type { Lang } from "@/types/shared";

export const getLang = createServerFn({ method: "GET" }).handler(async (): Promise<Lang> => {
  const langCookie = getCookie(LANG_COOKIE);
  const acceptLanguage = getRequestHeader("accept-language");
  return resolveLang(typeof langCookie === "string" ? langCookie : null, acceptLanguage ?? null);
});

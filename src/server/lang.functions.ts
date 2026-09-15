// tanstack
import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";

// services, features, and other libraries
import { z } from "zod";

// constants
import { LANG_COOKIE } from "@/lib/DataLoader";

const LangSchema = z.enum(["en", "pl"]);

export const setLangCookie = createServerFn({ method: "POST" })
  .validator((data: unknown) => LangSchema.parse(data))
  .handler(async ({ data }) => {
    setCookie(LANG_COOKIE, data, { maxAge: 2592000, httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" });
    return { lang: data };
  });

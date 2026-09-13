"use server";

// next
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// types
import type { Lang } from "@/types/shared";

// constants
const LANG_COOKIE = "lang";
const LANG_COOKIE_MAXAGE = 2592000;

// The cookie settings may vary based on whether in development or production mode
const LANG_COOKIE_OPTIONS = {
  maxAge: LANG_COOKIE_MAXAGE,
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
} satisfies Partial<ResponseCookie>;

export async function setLangCookie(lang: Lang) {
  // Save the user's selected language option in a secure cookie
  (await cookies()).set(LANG_COOKIE, lang, LANG_COOKIE_OPTIONS);

  // Revalidate, so the fresh data will be fetched from the server next time this path is visited
  revalidatePath("/");
}

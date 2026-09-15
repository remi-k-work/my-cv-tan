// tanstack
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start/server";

// services, features, and other libraries
import { z } from "zod";
import { resolveLang } from "@/lib/DataLoader";
import { ContactFormSchemaEn, ContactFormSchemaPl } from "@/schemas/contactForm";
import { useCaptchaSession } from "@/server/session";

// types
export type ContactActionStatus = "idle" | "succeeded" | "failed" | "invalid" | "invalid-captcha";

export interface ContactFormResult {
  actionStatus: ContactActionStatus;
  /** Field-level messages keyed by field name (from zod or captcha check). */
  fieldErrors?: Record<string, string[]>;
}

// constants
import { LANG_COOKIE } from "@/lib/DataLoader";

const ContactInputSchema = z.object({ name: z.string(), email: z.string(), subject: z.string(), message: z.string(), captcha: z.string() });

export const submitContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => ContactInputSchema.parse(data))
  .handler(async ({ data }): Promise<ContactFormResult> => {
    const lang = resolveLang(getCookie(LANG_COOKIE) ?? null, getRequestHeader("accept-language") ?? null);
    const schema = lang === "en" ? ContactFormSchemaEn : ContactFormSchemaPl;

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return { actionStatus: "invalid", fieldErrors };
    }

    // Check the captcha solution stored in the sealed session cookie.
    const session = await useCaptchaSession("captcha");
    if (parsed.data.captcha !== session.data.captchaString) {
      return { actionStatus: "invalid-captcha", fieldErrors: { captcha: ["invalid-captcha"] } };
    }

    try {
      // Submit the contact form with validated data
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: JSON.stringify({
          service_id: "default_service",
          template_id: "template_mmqusic",
          user_id: process.env.EMAILJS_PUB_KEY,
          template_params: { ...parsed.data },
          accessToken: process.env.EMAILJS_PRI_KEY,
        }),
      });
      if (!res.ok) throw new Error(res.statusText);
    } catch {
      return { actionStatus: "failed" };
    }

    return { actionStatus: "succeeded" };
  });

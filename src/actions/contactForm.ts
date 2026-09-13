/* eslint-disable @typescript-eslint/no-explicit-any */

"use server";

// next
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// other libraries
import DataLoader from "@/lib/DataLoader";
import { initialFormState, ServerValidateError } from "@tanstack/react-form-nextjs";
import { SERVER_VALIDATE_EN, SERVER_VALIDATE_PL } from "@/schemas/formFactory";
import { getIronSession } from "iron-session";

// types
import type { ServerFormState, StandardSchemaV1Issue } from "@tanstack/react-form-nextjs";
import type { CaptchaSession } from "@/app/auth/captcha/[name]/route";

export interface ContactFormActionResult extends ServerFormState<any, any> {
  actionStatus: "idle" | "succeeded" | "failed" | "invalid" | "invalid-captcha";
}

export default async function newContact(_prevState: unknown, formData: FormData): Promise<ContactFormActionResult> {
  try {
    // Create an instance of the data loader needed for localization
    const { lang, localizedContent } = await DataLoader.create();

    const validatedData = lang === "en" ? await SERVER_VALIDATE_EN(formData) : await SERVER_VALIDATE_PL(formData);

    // Check the captcha to ensure it matches
    const { captchaString } = await getIronSession<CaptchaSession>(await cookies(), { password: process.env.SESSION_SECRET as string, cookieName: "captcha" });

    if (validatedData?.captcha !== captchaString) {
      // The captcha is invalid; please try again
      const formErrors: Record<string, StandardSchemaV1Issue[]> = {
        captcha: [{ message: localizedContent()["contactFormFeedback"]["invalidCaptcha"], path: ["captcha"] }],
      };
      return {
        ...initialFormState,
        errors: [formErrors],
        errorMap: { onServer: { form: { ...formErrors }, fields: { ...formErrors } } },
        actionStatus: "invalid-captcha",
      };
    }

    // Submit the contact form with validated data
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        service_id: "default_service",
        template_id: "template_mmqusic",
        user_id: process.env.EMAILJS_PUB_KEY,
        template_params: { ...validatedData },
        accessToken: process.env.EMAILJS_PRI_KEY,
      }),
    });
    if (!res.ok) throw new Error(res.statusText);
  } catch (error) {
    // Validation has failed
    if (error instanceof ServerValidateError) {
      return { ...error.formState, actionStatus: "invalid" };
    }

    // Some other error occurred
    return { ...initialFormState, actionStatus: "failed" };
  }

  // Revalidate, so the fresh data will be fetched from the server next time this path is visited
  revalidatePath("/contact");

  // The form has successfully validated and submitted!
  return { ...initialFormState, actionStatus: "succeeded" };
}

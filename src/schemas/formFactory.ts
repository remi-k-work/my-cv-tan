// other libraries
import { z } from "zod";
import { createServerValidate, formOptions, initialFormState } from "@tanstack/react-form-nextjs";
import { ContactFormSchemaEn, ContactFormSchemaPl } from "./contactForm";

// types
import type { ContactFormActionResult } from "@/actions/contactForm";

// constants
const DEFAULT_VALUES: z.input<typeof ContactFormSchemaEn> = { name: "", email: "", subject: "", message: "", captcha: "" };

export const FORM_OPTIONS_EN = formOptions({ defaultValues: DEFAULT_VALUES });
export const FORM_OPTIONS_PL = formOptions({ defaultValues: DEFAULT_VALUES });

export const INITIAL_FORM_STATE: ContactFormActionResult = { ...initialFormState, actionStatus: "idle" };

export const SERVER_VALIDATE_EN = createServerValidate({ defaultValues: DEFAULT_VALUES, onServerValidate: ContactFormSchemaEn });
export const SERVER_VALIDATE_PL = createServerValidate({ defaultValues: DEFAULT_VALUES, onServerValidate: ContactFormSchemaPl });

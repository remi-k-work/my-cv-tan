// services, features, and other libraries
import { z } from "zod";
import { formOptions } from "@tanstack/react-form";

// constants
const DEFAULT_VALUES: z.input<typeof import("./contactForm").ContactFormSchemaEn> = { name: "", email: "", subject: "", message: "", captcha: "" };

export const FORM_OPTIONS_EN = formOptions({ defaultValues: DEFAULT_VALUES });
export const FORM_OPTIONS_PL = formOptions({ defaultValues: DEFAULT_VALUES });

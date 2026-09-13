// other libraries
import { z } from "zod";

export const ContactFormSchemaEn = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please provide your name; this is a necessary field")
    .max(25, "Please keep the name to a maximum of 25 characters")
    .default(""),
  email: z.email("The email address you gave appears to be incorrect; please update it").default(""),
  subject: z.string().trim().min(1, "Your message's subject is a required field").max(40, "Please keep the subject to a maximum of 40 characters").default(""),
  message: z
    .string()
    .trim()
    .min(1, "What is the message you want to send? This is a mandatory field")
    .max(2048, "Please keep the message to a maximum of 2048 characters")
    .default(""),
  captcha: z.string().trim().min(1, "A captcha is required to proceed").max(6, "The captcha is no more than six characters long").default(""),
});

export const ContactFormSchemaPl = z.object({
  name: z.string().trim().min(1, "Proszę podać swoje imię; jest to pole niezbędne").max(25, "Imię powinno mieć maksymalnie 25 znaków").default(""),
  email: z.email("Podany adres e-mail wydaje się być nieprawidłowy; zaktualizuj to").default(""),
  subject: z.string().trim().min(1, "Temat Twojej wiadomości jest polem wymaganym").max(40, "Temat wiadomości powinien mieć maksymalnie 40 znaków").default(""),
  message: z
    .string()
    .trim()
    .min(1, "Jaką wiadomość chcesz wysłać? Jest to pole obowiązkowe")
    .max(2048, "Wiadomość nie może mieć więcej niż 2048 znaków")
    .default(""),
  captcha: z.string().trim().min(1, "Captcha jest wymagane aby kontynuować").max(6, "Captcha musi być nie dłuższe niż 6 znaków").default(""),
});

export type ContactFormSchemaType = z.infer<typeof ContactFormSchemaEn>;

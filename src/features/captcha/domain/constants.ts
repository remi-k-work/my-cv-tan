// types
import type { Cookies } from "effect/http";

// constants
export const CAPTCHA_COOKIE_NAME = "captcha";

export const CAPTCHA_COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax", path: "/", secure: import.meta.env.PROD } as const satisfies Cookies.Cookie["options"];

// The one Cache-Control value the captcha endpoint declares
export const CAPTCHA_CACHE_CONTROL = "private, no-store";

export const CAPTCHA_WIDTH = 200;
export const CAPTCHA_HEIGHT = 50;

// The noise layer behind the letters
export const NOISE_RECT_COUNT = 32;
export const SHADE_STEPS = 5;
export const SHADE_STEP = 20;

// Generic browser font stacks; the SVG renders client-side, so letterforms come from the viewer's system
export const LETTER_FONTS = ["monospace", "sans-serif", "serif", "cursive", "fantasy"] as const;

export const PERMITTED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const STRENGTH = 6;

export const SALT_BYTES = 16;

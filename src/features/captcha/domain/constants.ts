// constants
export const CAPTCHA_WIDTH = 200;
export const CAPTCHA_HEIGHT = 50;

// Generic browser font stacks; the SVG renders client-side, so letterforms come from the viewer's system
export const LETTER_FONTS = ["monospace", "sans-serif", "serif", "cursive", "fantasy"] as const;

export const PERMITTED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const STRENGTH = 6;

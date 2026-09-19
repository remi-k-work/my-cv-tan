// services, features, and other libraries
import { Effect, Random } from "effect";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH, LETTER_FONTS } from ".";

export const randomBackground = Effect.gen(function* () {
  const r = yield* Random.nextIntBetween(125, 175);
  const g = yield* Random.nextIntBetween(125, 175);
  const b = yield* Random.nextIntBetween(125, 175);

  const shades: string[] = [];
  for (let i = 0; i < 5; i++) {
    shades.push(`rgb(${r - 20 * i},${g - 20 * i},${b - 20 * i})`);
  }

  let rects = "";
  for (let i = 0; i < 32; i++) {
    const x = yield* Random.nextIntBetween(0, CAPTCHA_WIDTH);
    const y = yield* Random.nextIntBetween(0, CAPTCHA_HEIGHT);
    const w = yield* Random.nextIntBetween(2, 10);
    const h = yield* Random.nextIntBetween(10, 40);
    const rot = yield* Random.nextIntBetween(-30, 30);
    const fill = shades[yield* Random.nextIntBetween(0, 4)];
    rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"/>`;
  }

  return `<rect width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" fill="rgb(${r},${g},${b})"/>${rects}`;
});

export const renderLetters = Effect.fn("renderLetters")(function* (captchaString: string) {
  let out = "";
  for (let i = 0; i < captchaString.length; i++) {
    const font = LETTER_FONTS[yield* Random.nextIntBetween(0, LETTER_FONTS.length - 1)];
    const x = 16 + i * 30 + (yield* Random.nextIntBetween(-4, 4));
    const y = 33 + (yield* Random.nextIntBetween(-8, 8));
    const rot = yield* Random.nextIntBetween(-15, 15);
    const fill = (yield* Random.nextIntBetween(0, 1)) === 0 ? "rgb(0,0,0)" : "rgb(255,255,255)";
    out += `<text x="${x}" y="${y}" font-family="${font},sans-serif" font-size="25" font-weight="bold" text-anchor="middle" fill="${fill}" transform="rotate(${rot} ${x} ${y})">${captchaString[i]}</text>`;
  }
  return out;
});

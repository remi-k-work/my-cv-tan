// services, features, and other libraries
import { Array, Effect, Random } from "effect";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH, LETTER_FONTS } from ".";

const makeRect = Effect.fn("makeRect")(function* (shades: ReadonlyArray<string>) {
  const x = yield* Random.nextIntBetween(0, CAPTCHA_WIDTH);
  const y = yield* Random.nextIntBetween(0, CAPTCHA_HEIGHT);
  const w = yield* Random.nextIntBetween(2, 10);
  const h = yield* Random.nextIntBetween(10, 40);
  const rot = yield* Random.nextIntBetween(-30, 30);
  const fill = shades[yield* Random.nextIntBetween(0, shades.length - 1)];
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"/>`;
});

const randomBackground = Effect.gen(function* () {
  const [r, g, b] = yield* Effect.all([Random.nextIntBetween(125, 175), Random.nextIntBetween(125, 175), Random.nextIntBetween(125, 175)]);
  const shades = Array.makeBy(5, (index) => `rgb(${r - 20 * index},${g - 20 * index},${b - 20 * index})`);
  const rects = yield* Effect.replicateEffect(32)(makeRect(shades)).pipe(Effect.map(Array.join("")));
  return `<rect width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" fill="rgb(${r},${g},${b})"/>${rects}`;
});

const renderLetter = Effect.fn("renderLetter")(function* (captchaChar: string, index: number) {
  const font = LETTER_FONTS[yield* Random.nextIntBetween(0, LETTER_FONTS.length - 1)];
  const x = 16 + index * 30 + (yield* Random.nextIntBetween(-4, 4));
  const y = 33 + (yield* Random.nextIntBetween(-8, 8));
  const rot = yield* Random.nextIntBetween(-15, 15);
  const fill = (yield* Random.nextBoolean) ? "rgb(255,255,255)" : "rgb(0,0,0)";
  return `<text x="${x}" y="${y}" font-family="${font},sans-serif" font-size="25" font-weight="bold" text-anchor="middle" fill="${fill}" transform="rotate(${rot} ${x} ${y})">${captchaChar}</text>`;
});

const renderLetters = Effect.fn("renderLetters")((captchaString: string) =>
  Effect.forEach(Array.fromIterable(captchaString), renderLetter).pipe(Effect.map(Array.join("")))
);

export const createCaptchaSvg = Effect.fn("createCaptchaSvg")((captchaString: string) =>
  Effect.all({ background: randomBackground, letters: renderLetters(captchaString) }).pipe(
    Effect.map(
      ({ background, letters }) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" viewBox="0 0 ${CAPTCHA_WIDTH} ${CAPTCHA_HEIGHT}">${background}${letters}</svg>`
    )
  )
);

// services, features, and other libraries
import { Array, Effect, Random } from "effect";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH, LETTER_FONTS, NOISE_RECT_COUNT, SHADE_STEP, SHADE_STEPS } from "./constants";

const makeRect = Effect.fnUntraced(function* (shades: Array.NonEmptyReadonlyArray<string>) {
  const { x, y, w, h, rot, fill } = yield* Effect.all({
    x: Random.nextIntBetween(0, CAPTCHA_WIDTH),
    y: Random.nextIntBetween(0, CAPTCHA_HEIGHT),
    w: Random.nextIntBetween(2, 10),
    h: Random.nextIntBetween(10, 40),
    rot: Random.nextIntBetween(-30, 30),
    fill: Random.choice(shades),
  });
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"/>`;
});

const randomBackground = Effect.gen(function* () {
  const [r, g, b] = yield* Effect.all([Random.nextIntBetween(125, 175), Random.nextIntBetween(125, 175), Random.nextIntBetween(125, 175)]);
  const shades = Array.makeBy(SHADE_STEPS, (index) => `rgb(${r - SHADE_STEP * index},${g - SHADE_STEP * index},${b - SHADE_STEP * index})`);
  const rects = yield* Effect.replicateEffect(NOISE_RECT_COUNT)(makeRect(shades)).pipe(Effect.map(Array.join("")));
  return `<rect width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" fill="rgb(${r},${g},${b})"/>${rects}`;
});

const renderLetter = Effect.fnUntraced(function* (captchaChar: string, index: number) {
  const { font, dx, dy, rot, isWhite } = yield* Effect.all({
    font: Random.choice(LETTER_FONTS),
    dx: Random.nextIntBetween(-4, 4),
    dy: Random.nextIntBetween(-8, 8),
    rot: Random.nextIntBetween(-15, 15),
    isWhite: Random.nextBoolean,
  });
  const x = 16 + index * 30 + dx;
  const y = 33 + dy;
  const fill = isWhite ? "rgb(255,255,255)" : "rgb(0,0,0)";
  return `<text x="${x}" y="${y}" font-family="${font},sans-serif" font-size="25" font-weight="bold" text-anchor="middle" fill="${fill}" transform="rotate(${rot} ${x} ${y})">${captchaChar}</text>`;
});

export const createCaptchaSvg = Effect.fnUntraced(function* (captchaString: string) {
  const { background, letters } = yield* Effect.all({
    background: randomBackground,
    letters: Effect.forEach(captchaString, renderLetter).pipe(Effect.map(Array.join(""))),
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" viewBox="0 0 ${CAPTCHA_WIDTH} ${CAPTCHA_HEIGHT}">${background}${letters}</svg>`;
});

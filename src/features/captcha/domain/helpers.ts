// services, features, and other libraries
import { Array, Effect, Random } from "effect";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH, LETTER_FONTS } from "./constants";

const randomElement = <A>(items: ReadonlyArray<A>) => Random.nextIntBetween(0, items.length - 1).pipe(Effect.map((index) => items[index]));

const makeRect = Effect.fnUntraced(function* (shades: ReadonlyArray<string>) {
  const { x, y, w, h, rot, fill } = yield* Effect.all(
    {
      x: Random.nextIntBetween(0, CAPTCHA_WIDTH),
      y: Random.nextIntBetween(0, CAPTCHA_HEIGHT),
      w: Random.nextIntBetween(2, 10),
      h: Random.nextIntBetween(10, 40),
      rot: Random.nextIntBetween(-30, 30),
      fill: randomElement(shades),
    },
    { concurrency: "unbounded" }
  );
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"/>`;
});

const randomBackground = Effect.gen(function* () {
  const [r, g, b] = yield* Effect.all([Random.nextIntBetween(125, 175), Random.nextIntBetween(125, 175), Random.nextIntBetween(125, 175)], {
    concurrency: "unbounded",
  });
  const shades = Array.makeBy(5, (index) => `rgb(${r - 20 * index},${g - 20 * index},${b - 20 * index})`);
  const rects = yield* Effect.replicateEffect(32)(makeRect(shades)).pipe(Effect.map(Array.join("")));
  return `<rect width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" fill="rgb(${r},${g},${b})"/>${rects}`;
});

const renderLetter = Effect.fnUntraced(function* (captchaChar: string, index: number) {
  const { font, dx, dy, rot, isWhite } = yield* Effect.all(
    {
      font: randomElement(LETTER_FONTS),
      dx: Random.nextIntBetween(-4, 4),
      dy: Random.nextIntBetween(-8, 8),
      rot: Random.nextIntBetween(-15, 15),
      isWhite: Random.nextBoolean,
    },
    { concurrency: "unbounded" }
  );
  const x = 16 + index * 30 + dx;
  const y = 33 + dy;
  const fill = isWhite ? "rgb(255,255,255)" : "rgb(0,0,0)";
  return `<text x="${x}" y="${y}" font-family="${font},sans-serif" font-size="25" font-weight="bold" text-anchor="middle" fill="${fill}" transform="rotate(${rot} ${x} ${y})">${captchaChar}</text>`;
});

export const createCaptchaSvg = Effect.fn("createCaptchaSvg")((captchaString: string) =>
  Effect.all(
    { background: randomBackground, letters: Effect.forEach(Array.fromIterable(captchaString), renderLetter).pipe(Effect.map(Array.join(""))) },
    { concurrency: "unbounded" }
  ).pipe(
    Effect.map(
      ({ background, letters }) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" viewBox="0 0 ${CAPTCHA_WIDTH} ${CAPTCHA_HEIGHT}">${background}${letters}</svg>`
    )
  )
);

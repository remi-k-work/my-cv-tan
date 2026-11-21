// services, features, and other libraries
import { assert, it } from "@effect/vitest";
import { Effect, Random } from "effect";
import { createCaptchaSvg } from "../helpers";

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH, NOISE_RECT_COUNT } from "../constants";

const countMatches = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;
const RECT = /<rect /g;
const TEXT = /<text /g;

it.effect("renders an svg at the declared dimensions, with the noise layer and one text per code point", () =>
  Effect.gen(function* () {
    // An astral character is one code point, so a six-ASCII answer and one containing it both
    // render their letters without splitting a surrogate pair across two `<text>` elements
    for (const answer of ["ABCDEF", "𐍈대AB"]) {
      const svg = yield* createCaptchaSvg(answer);

      assert.match(svg, new RegExp(`width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" viewBox="0 0 ${CAPTCHA_WIDTH} ${CAPTCHA_HEIGHT}"`));
      // The background rect plus the fixed noise rect count, so a lost layer is visible here
      assert.strictEqual(countMatches(svg, RECT), 1 + NOISE_RECT_COUNT, `noise layer for ${answer}`);
      // Letters are iterated as an Iterable of code points, matching the unit the field schema caps
      assert.strictEqual(countMatches(svg, TEXT), Array.from(answer).length, `letters for ${answer}`);
    }
  })
);

// The background draws each channel from one shade range, but reusing that one effect value must
// still produce three independent draws: `Effect.all` executes every element separately. A fixed
// seed proves that directly with an exact non-grey fill, without relying on cross-render uniqueness
it.effect("draws the background's three shade channels independently", () =>
  Effect.gen(function* () {
    const svg = yield* createCaptchaSvg("ABCDEF");

    assert.include(svg, `<rect width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" fill="rgb(156,143,125)"/>`);
  }).pipe(Random.withSeed("captcha-background"))
);

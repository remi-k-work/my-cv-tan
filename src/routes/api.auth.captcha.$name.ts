import { createFileRoute } from "@tanstack/react-router";

import { getRandomInt } from "@/lib/helpers";
import { useCaptchaSession } from "@/server/session";
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/auth/captcha";

// Generic browser font stacks: the SVG renders client-side, so letterforms
// come from the viewer's system. Rotation, offsets, colors and background
// noise still vary per request, which is what makes the captcha effective.
const LETTER_FONTS = ["monospace", "sans-serif", "serif", "cursive", "fantasy"];

function randomBackground(): string {
  const r = getRandomInt(125, 175);
  const g = getRandomInt(125, 175);
  const b = getRandomInt(125, 175);

  const shades: string[] = [];
  for (let i = 0; i < 5; i++) {
    shades.push(`rgb(${r - 20 * i},${g - 20 * i},${b - 20 * i})`);
  }

  let rects = "";
  for (let i = 0; i < 32; i++) {
    const x = getRandomInt(0, CAPTCHA_WIDTH);
    const y = getRandomInt(0, CAPTCHA_HEIGHT);
    const w = getRandomInt(2, 10);
    const h = getRandomInt(10, 40);
    const rot = getRandomInt(-30, 30);
    const fill = shades[getRandomInt(0, 4)];
    rects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"/>`;
  }

  return `<rect width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" fill="rgb(${r},${g},${b})"/>${rects}`;
}

function renderLetters(captchaString: string): string {
  let out = "";
  for (let i = 0; i < captchaString.length; i++) {
    const font = LETTER_FONTS[getRandomInt(0, LETTER_FONTS.length - 1)];
    const x = 16 + i * 30 + getRandomInt(-4, 4);
    const y = 33 + getRandomInt(-8, 8);
    const rot = getRandomInt(-15, 15);
    const fill = getRandomInt(0, 1) === 0 ? "rgb(0,0,0)" : "rgb(255,255,255)";
    out += `<text x="${x}" y="${y}" font-family="${font},sans-serif" font-size="25" font-weight="bold" text-anchor="middle" fill="${fill}" transform="rotate(${rot} ${x} ${y})">${captchaString[i]}</text>`;
  }
  return out;
}

export const Route = createFileRoute("/api/auth/captcha/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { name } = params;

        const permittedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const strength = 6;
        let captchaString = "";
        for (let i = 0; i < strength; i++) {
          captchaString += permittedChars[getRandomInt(0, permittedChars.length - 1)];
        }

        const session = await useCaptchaSession(name);
        await session.update({ captchaString });

        const svg =
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CAPTCHA_WIDTH}" height="${CAPTCHA_HEIGHT}" viewBox="0 0 ${CAPTCHA_WIDTH} ${CAPTCHA_HEIGHT}">` +
          `${randomBackground()}${renderLetters(captchaString)}</svg>`;

        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});

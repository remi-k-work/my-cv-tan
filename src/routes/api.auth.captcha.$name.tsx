import { createFileRoute } from "@tanstack/react-router";
import { promises as fs } from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

import { getRandomInt } from "@/lib/helpers";
import { useCaptchaSession } from "@/server/session";
import CaptchaBackground, { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/auth/components/CaptchaBackground";
import CaptchaString from "@/features/auth/components/CaptchaString";

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

        const fontsDir = path.resolve(process.cwd(), "public/fonts");
        const [fontAcme, fontMerr, fontPlay, fontUbun] = await Promise.all([
          fs.readFile(path.join(fontsDir, "acme.ttf")),
          fs.readFile(path.join(fontsDir, "merr.ttf")),
          fs.readFile(path.join(fontsDir, "play.ttf")),
          fs.readFile(path.join(fontsDir, "ubun.ttf")),
        ]);

        const svg = await satori(
          (
            <div style={{ position: "relative", display: "flex", width: CAPTCHA_WIDTH, height: CAPTCHA_HEIGHT }}>
              <CaptchaBackground />
              <CaptchaString string={captchaString} />
            </div>
          ),
          {
            width: CAPTCHA_WIDTH,
            height: CAPTCHA_HEIGHT,
            fonts: [
              { name: "acme", data: fontAcme, weight: 400, style: "normal" },
              { name: "merr", data: fontMerr, weight: 400, style: "normal" },
              { name: "play", data: fontPlay, weight: 400, style: "normal" },
              { name: "ubun", data: fontUbun, weight: 400, style: "normal" },
            ],
          },
        );

        const png = new Resvg(svg, { fitTo: { mode: "width", value: CAPTCHA_WIDTH } }).render().asPng();

        return new Response(new Uint8Array(png), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "private, no-store",
            "Content-Length": String(png.length),
          },
        });
      },
    },
  },
});

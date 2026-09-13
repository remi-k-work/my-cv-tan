// node.js
import { promises as fs } from "fs";
import path from "path";

// next
import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { cookies } from "next/headers";

// other libraries
import { getRandomInt } from "@/lib/helpers";
import { getIronSession } from "iron-session";

// components
import CaptchaBackground from "@/features/auth/components/CaptchaBackground";
import CaptchaString from "@/features/auth/components/CaptchaString";

// types
export interface CaptchaSession {
  captchaString: string;
}

// constants
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "@/features/auth/components/CaptchaBackground";
const FONTS_DIR = "public/fonts";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params: paramsPromise }: RouteContext<"/auth/captcha/[name]">) {
  const { name } = await paramsPromise;

  // Load the pool of fonts used by our captcha
  const fontsDir = path.resolve(process.cwd(), FONTS_DIR);
  const [fontAcme, fontMerr, fontPlay, fontUbun] = await Promise.all([
    fs.readFile(path.join(fontsDir, "acme.ttf")),
    fs.readFile(path.join(fontsDir, "merr.ttf")),
    fs.readFile(path.join(fontsDir, "play.ttf")),
    fs.readFile(path.join(fontsDir, "ubun.ttf")),
  ]);

  // Contains all of the characters we wish to utilize to build our captcha string
  const permittedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // How long should the captcha string be?
  const strength = 6;

  let captchaString = "";
  for (let i = 0; i < strength; i++) {
    captchaString += permittedChars[getRandomInt(0, permittedChars.length - 1)];
  }

  // We will be using sessions to store the captcha solution
  const session = await getIronSession<CaptchaSession>(await cookies(), {
    password: process.env.SESSION_SECRET as string,
    cookieName: name,
    cookieOptions: { secure: process.env.NODE_ENV === "production", maxAge: undefined },
  });
  session.captchaString = captchaString;
  await session.save();

  return new ImageResponse(
    (
      <>
        <CaptchaBackground />
        <CaptchaString string={captchaString} />
      </>
    ),
    {
      width: CAPTCHA_WIDTH,
      height: CAPTCHA_HEIGHT,
      fonts: [
        { name: "acme", data: fontAcme, style: "normal" },
        { name: "merr", data: fontMerr, style: "normal" },
        { name: "play", data: fontPlay, style: "normal" },
        { name: "ubun", data: fontUbun, style: "normal" },
      ],
    },
  );
}

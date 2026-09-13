// react
import { ReactElement } from "react";

// other libraries
import { getRandomInt } from "@/lib/helpers";
import { CAPTCHA_HEIGHT, CAPTCHA_WIDTH } from "./CaptchaBackground";

// types
interface CaptchaStringProps {
  string: string;
}

export default function CaptchaString({ string }: CaptchaStringProps) {
  // The palette is an array of all possible [r, g, b] color tuples from which to choose
  const palette: [number, number, number][] = [
    [0, 0, 0],
    [255, 255, 255],
  ];

  // Pool of fonts to get some variation in the characters
  const fonts = ["acme", "merr", "play", "ubun"];

  // Rendering the text string above the background
  const letters: ReactElement<unknown>[] = [];

  for (let i = 0; i < string.length; i++) {
    // The characters will be unique; however, they should be slightly rotated and in black and white
    const font = `"${fonts[getRandomInt(0, 3)]}"`;
    const transform = `rotate(${getRandomInt(-15, +15)}deg) translateY(${getRandomInt(-10, +10)}px)`;

    // Choose black or white at random for each letter
    const color = palette[getRandomInt(0, 1)];
    const txColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    // We are only using capital letters in the english alphabet to avoid any confusion
    // that might arise due to letters or numbers that might look alike
    letters.push(
      <span key={i} style={{ fontFamily: font, color: txColor, transform: transform, margin: "4px" }}>
        {string[i]}
      </span>,
    );
  }

  return (
    <div
      style={{
        width: `${CAPTCHA_WIDTH}px`,
        height: `${CAPTCHA_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "25px",
        position: "absolute",
        overflow: "hidden",
      }}
    >
      {letters}
    </div>
  );
}

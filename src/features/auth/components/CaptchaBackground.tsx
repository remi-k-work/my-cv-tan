// react
import { ReactElement } from "react";

// other libraries
import { getRandomInt } from "@/lib/helpers";

export const CAPTCHA_WIDTH = 200;
export const CAPTCHA_HEIGHT = 50;

export default function CaptchaBackground() {
  // The palette is an array of all possible [r, g, b] color tuples from which to choose
  const palette: [number, number, number][] = [];

  // Determine the base random rgb color for the captcha's background
  const r = getRandomInt(125, 175);
  const g = getRandomInt(125, 175);
  const b = getRandomInt(125, 175);

  // Create progressively darker shades of the original color
  for (let i = 0; i < 5; i++) {
    palette.push([r - 20 * i, g - 20 * i, b - 20 * i]);
  }

  // Draw rectangles at random locations on our original background
  const rects: ReactElement<unknown>[] = [];

  for (let i = 0; i < 32; i++) {
    // The width, height, rotation, and color of those rectangles vary
    const left = `${getRandomInt(0, CAPTCHA_WIDTH)}px`;
    const top = `${getRandomInt(0, CAPTCHA_HEIGHT)}px`;
    const width = `${getRandomInt(2, 10)}px`;
    const height = `${getRandomInt(10, 40)}px`;
    const transform = `rotate(${getRandomInt(-30, +30)}deg)`;

    // Select a darker shade at random for each rectangle
    const color = palette[getRandomInt(0, 4)];
    const bgColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    // Drawing all of these rectangles increases the number of colors in the background,
    // making it more difficult to identify the captcha string from the captcha's background
    rects.push(
      <div key={i} style={{ left: left, top: top, width: width, height: height, transform: transform, backgroundColor: bgColor, position: "absolute" }}></div>,
    );
  }

  // Use the base random rgb for the captcha's background
  const bgColor = `rgb(${r}, ${g}, ${b})`;

  return (
    <div
      style={{
        width: `${CAPTCHA_WIDTH}px`,
        height: `${CAPTCHA_HEIGHT}px`,
        display: "flex",
        backgroundColor: bgColor,
        overflow: "hidden",
      }}
    >
      {rects}
    </div>
  );
}

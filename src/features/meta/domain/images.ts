// services, features, and other libraries
import { Option, pipe } from "effect";
import { experienceImageUrl } from "./url";

// types
import type { SocialImage } from "./models";

// constants
import { GLOBAL_SOCIAL_IMAGE } from "./constants";
import { SCREENSHOT_HEIGHT, SCREENSHOT_WIDTH } from "@/features/experience/domain/constants";

// One home for "which image represents an experience": og:image and the JSON-LD image both
// resolve here, so the social tags and structured data can never disagree about the picture

// The webp screenshot when one exists; None means no screenshot renders on the page,
// so structured data must not claim a primary image it cannot show
export const experienceScreenshot = (imageName: string): Option.Option<SocialImage> =>
  pipe(
    experienceImageUrl(imageName),
    Option.map((src) => ({ src, mime: "image/webp" as const, width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT }))
  );

// The share image: the screenshot, or the global jpeg banner — X/Twitter cards only
// reliably accept jpeg/png, so the webp never leaks onto social surfaces
export const experienceShareImage = (imageName: string): SocialImage => Option.getOrElse(experienceScreenshot(imageName), () => GLOBAL_SOCIAL_IMAGE);

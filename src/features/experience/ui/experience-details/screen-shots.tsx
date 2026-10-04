// types
import type { Experience } from "@/features/experience/domain";

interface ScreenShotsProps {
  experience: Experience;
}

// constants
import { SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT } from "@/features/experience/domain";

export function ScreenShots({ experience: { role, imageName } }: ScreenShotsProps) {
  return (
    <article className="grid">
      <img
        src={`/images/${imageName}-a.webp`}
        width={SCREENSHOT_WIDTH}
        height={SCREENSHOT_HEIGHT}
        alt={role}
        className="col-span-full row-span-full animate-fade-in-out opacity-0 [animation-delay:-9.6s]"
      />
      <img
        src={`/images/${imageName}-b.webp`}
        width={SCREENSHOT_WIDTH}
        height={SCREENSHOT_HEIGHT}
        alt={role}
        className="col-span-full row-span-full animate-fade-in-out opacity-0 [animation-delay:6.4s]"
      />
      <img
        src={`/images/${imageName}-c.webp`}
        width={SCREENSHOT_WIDTH}
        height={SCREENSHOT_HEIGHT}
        alt={role}
        className="col-span-full row-span-full animate-fade-in-out opacity-0 [animation-delay:22.4s]"
      />
    </article>
  );
}

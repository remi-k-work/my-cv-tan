// next
import Image from "next/image";

// types
import type { JobExperience } from "@/types/shared";

interface ScreenShotsProps {
  experience: JobExperience;
}

// constants
const SCREENSHOT_WIDTH = 1600;
const SCREENSHOT_HEIGHT = 900;

export default function ScreenShots({ experience: { role, imageName } }: ScreenShotsProps) {
  return (
    <article className="grid">
      <Image
        src={`/images/${imageName}-a.webp`}
        width={SCREENSHOT_WIDTH}
        height={SCREENSHOT_HEIGHT}
        alt={role}
        className="animate-fade-in-out col-span-full row-span-full opacity-0 [animation-delay:-9.6s]"
      />
      <Image
        src={`/images/${imageName}-b.webp`}
        width={SCREENSHOT_WIDTH}
        height={SCREENSHOT_HEIGHT}
        alt={role}
        className="animate-fade-in-out col-span-full row-span-full opacity-0 [animation-delay:6.4s]"
      />
      <Image
        src={`/images/${imageName}-c.webp`}
        width={SCREENSHOT_WIDTH}
        height={SCREENSHOT_HEIGHT}
        alt={role}
        className="animate-fade-in-out col-span-full row-span-full opacity-0 [animation-delay:22.4s]"
      />
    </article>
  );
}

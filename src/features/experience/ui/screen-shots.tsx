// types
import type { Experience } from "@/features/experience/domain";

interface ScreenShotsProps {
  experience: Experience;
}

// constants
import { SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT } from "@/features/experience/domain";

// The three screenshots that crossfade into one another; delays are literal class strings so Tailwind can generate them
const FADE_CYCLE = [
  { suffix: "a", className: "[animation-delay:-9.6s]" },
  { suffix: "b", className: "[animation-delay:6.4s]" },
  { suffix: "c", className: "[animation-delay:22.4s]" },
] as const;

// The experience's cycling screenshots; links to the project's video or live site when it has one
export function ScreenShots({ experience: { role, imageName, liveLink, videoLink } }: ScreenShotsProps) {
  const shots = (
    // translateZ floats the screenshots above the tilting slide card; outside a preserve-3d parent it is a harmless no-op
    <article className="grid [transform:translateZ(24px)]">
      {FADE_CYCLE.map(({ suffix, className }) => (
        <img
          key={suffix}
          src={`/images/${imageName}-${suffix}.webp`}
          width={SCREENSHOT_WIDTH}
          height={SCREENSHOT_HEIGHT}
          alt={role}
          className={`col-span-full row-span-full animate-fade-in-out opacity-0 ${className}`}
        />
      ))}
    </article>
  );

  const href = videoLink ?? liveLink;

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {shots}
    </a>
  ) : (
    shots
  );
}

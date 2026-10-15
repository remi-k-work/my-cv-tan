// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useGT } from "gt-tanstack-start";

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
export function ScreenShots({ experience: { role, company, imageName, liveLink, videoLink } }: ScreenShotsProps) {
  const gt = useGT();

  const shots = (
    // Framed and clipped so the shots read as a single image panel, and leaning towards the pointer when it
    // hovers a linked panel — the whole stack moves as one layer while the crossfade keeps running
    <div className={cn("grid overflow-clip rounded-lg transition duration-300 ease-in-out", "group-hover:scale-105")}>
      {FADE_CYCLE.map(({ suffix, className }, index) => (
        <img
          key={suffix}
          className={cn("col-span-full row-span-full animate-fade-in-out opacity-0", className)}
          src={`/images/${imageName}-${suffix}.webp`}
          width={SCREENSHOT_WIDTH}
          height={SCREENSHOT_HEIGHT}
          // The empty alt on the later frames already keeps them out of the accessibility tree; no aria-hidden needed
          alt={index === 0 ? `${role}, ${company}` : ""}
        />
      ))}
    </div>
  );

  const href = videoLink ?? liveLink;
  // Ordered project-first so the thumbnail link reads differently from the matching LinkChip in the same slide
  const linkLabel = `${role}, ${company} — ${videoLink ? gt("Watch Video") : gt("Live Link")}`;

  return href ? (
    <a className="group" href={href} target="_blank" rel="noopener noreferrer" aria-label={linkLabel}>
      {shots}
    </a>
  ) : (
    shots
  );
}

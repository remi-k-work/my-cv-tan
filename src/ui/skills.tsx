// services, features, and other libraries
import { cn } from "@/lib/utils";

// assets
import html from "@/assets/my-skills-html.svg";
import css from "@/assets/my-skills-css.svg";
import javascript from "@/assets/my-skills-javascript.svg";
import typescript from "@/assets/my-skills-typescript.svg";
import react from "@/assets/my-skills-react.svg";
import nextjs from "@/assets/my-skills-nextjs.svg";
import inkscape from "@/assets/my-skills-inkscape.svg";
import gimp from "@/assets/my-skills-gimp.svg";

// types
interface SkillSource {
  src: string;
  alt: string;
}

type SlidePhase = keyof typeof SLIDE_PHASE_CLASSES;
type SlideDelay = keyof typeof SLIDE_DELAY_CLASSES;

// constants
// Kept as literal class strings so Tailwind can generate them
const SLIDE_PHASE_CLASSES = {
  stay: "max-lg:animate-slide-bt lg:animate-slide-lr [--_dest-opacity:1]",
  out: "max-lg:animate-slide-bt-fade-out lg:animate-slide-lr-fade-out [--_dest-opacity:1]",
  in: "max-lg:animate-slide-bt-fade-in lg:animate-slide-lr-fade-in [--_dest-opacity:0]",
} as const;

const SLIDE_DELAY_CLASSES = {
  "0.2s": "max-lg:[animation-delay:0.2s] lg:[animation-delay:0.2s]",
  "0.4s": "max-lg:[animation-delay:0.4s] lg:[animation-delay:0.4s]",
  "0.6s,8s": "max-lg:[animation-delay:0.6s,8s] lg:[animation-delay:0.6s,8s]",
  "0.8s,16s": "max-lg:[animation-delay:0.8s,16s] lg:[animation-delay:0.8s,16s]",
} as const;

function SkillIcon({ src, alt, delay, phase = "stay" }: SkillSource & { delay?: SlideDelay; phase?: SlidePhase }) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "max-h-24 w-full max-w-24 opacity-0",
        "max-lg:translate-y-full lg:-translate-x-full",
        SLIDE_PHASE_CLASSES[phase],
        delay !== undefined && SLIDE_DELAY_CLASSES[delay]
      )}
    />
  );
}

// Two skills trading places in a single cell: the first slides in then periodically fades out while the second fades in
function SwappingSkillPair({ first, second, delay }: { first: SkillSource; second: SkillSource; delay: SlideDelay }) {
  return (
    <li className="grid *:col-span-full *:row-span-full">
      <SkillIcon {...first} delay={delay} phase="out" />
      <SkillIcon {...second} delay={delay} phase="in" />
    </li>
  );
}

export function Skills() {
  return (
    <aside
      className={cn(
        "z-9 grid w-full bg-surface-2 [grid-area:skills]",
        "max-lg:fixed max-lg:bottom-0 max-lg:h-28",

        "before:fixed before:content-['']",
        "lg:after:fixed lg:after:left-33 lg:after:-z-1 lg:after:h-full lg:after:w-px lg:after:content-['']",

        "max-lg:before:bottom-14 max-lg:before:left-0 max-lg:before:h-px max-lg:before:w-full",
        "lg:before:left-11 lg:before:h-full lg:before:w-px",

        "before:from-primary before:via-accent before:via-5% before:to-primary before:to-10%",
        "max-lg:before:animate-spark-h max-lg:before:bg-linear-to-r max-lg:before:bg-size-[200%]",
        "lg:before:animate-spark-v lg:before:bg-linear-to-b lg:before:bg-size-[100%_200%]",

        "lg:after:from-primary lg:after:via-accent lg:after:via-5% lg:after:to-primary lg:after:to-10%",
        "lg:after:direction-[reverse] lg:after:animate-spark-v lg:after:bg-linear-to-b lg:after:bg-size-[100%_200%]"
      )}
    >
      <ul
        className={cn(
          "grid place-content-evenly place-items-center gap-2",
          "grid-flow-col grid-cols-none",
          "lg:sticky lg:top-28 lg:h-[calc(100dvh-7rem)] lg:grid-flow-row lg:grid-cols-2"
        )}
      >
        <li>
          <SkillIcon src={html} alt="HTML" />
        </li>
        <li>
          <SkillIcon src={css} alt="CSS" delay="0.2s" />
        </li>
        <SwappingSkillPair delay="0.4s" first={{ src: javascript, alt: "JavaScript" }} second={{ src: typescript, alt: "TypeScript" }} />
        <SwappingSkillPair delay="0.6s,8s" first={{ src: react, alt: "React" }} second={{ src: nextjs, alt: "NextJS" }} />
        <SwappingSkillPair delay="0.8s,16s" first={{ src: inkscape, alt: "Inkscape" }} second={{ src: gimp, alt: "GIMP" }} />
      </ul>
    </aside>
  );
}

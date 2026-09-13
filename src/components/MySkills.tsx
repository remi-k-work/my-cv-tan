// next
import Image from "next/image";

// other libraries
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

export default function MySkills() {
  return (
    <aside
      className={cn(
        "bg-clr-primary-800 z-9 grid w-full [grid-area:skills]",
        "max-lg:fixed max-lg:bottom-0 max-lg:h-28",

        "before:fixed before:content-['']",
        "lg:after:fixed lg:after:left-33 lg:after:-z-1 lg:after:h-full lg:after:w-px lg:after:content-['']",

        "max-lg:before:bottom-14 max-lg:before:left-0 max-lg:before:h-px max-lg:before:w-full",
        "lg:before:left-11 lg:before:h-full lg:before:w-px",

        "before:from-primary-foreground before:to-primary-foreground before:via-accent-foreground before:via-5% before:to-10%",
        "max-lg:before:animate-spark-h max-lg:before:bg-gradient-to-r max-lg:before:bg-size-[200%]",
        "lg:before:animate-spark-v lg:before:bg-gradient-to-b lg:before:bg-size-[100%_200%]",

        "lg:after:from-primary-foreground lg:after:to-primary-foreground lg:after:via-accent-foreground lg:after:via-5% lg:after:to-10%",
        "lg:after:animate-spark-v lg:after:bg-gradient-to-b lg:after:bg-size-[100%_200%] lg:after:[animation-direction:reverse]",
      )}
    >
      <ul
        className={cn(
          "grid place-content-evenly place-items-center gap-2",
          "grid-flow-col grid-cols-none",
          "lg:sticky lg:top-28 lg:h-[calc(100dvh-7rem)] lg:grid-flow-row lg:grid-cols-2",
        )}
      >
        <li>
          <Image
            src={html}
            alt="HTML"
            className={cn(
              "max-h-24 w-full max-w-24 opacity-0 [--_dest-opacity:1]",
              "max-lg:animate-slide-bt max-lg:translate-y-full",
              "lg:animate-slide-lr lg:-translate-x-full",
            )}
          />
        </li>
        <li>
          <Image
            src={css}
            alt="CSS"
            className={cn(
              "max-h-24 w-full max-w-24 opacity-0 [--_dest-opacity:1]",
              "max-lg:animate-slide-bt max-lg:translate-y-full max-lg:[animation-delay:0.2s]",
              "lg:animate-slide-lr lg:-translate-x-full lg:[animation-delay:0.2s]",
            )}
          />
        </li>
        <li className="grid *:col-span-full *:row-span-full">
          <Image
            src={javascript}
            alt="JavaScript"
            className={cn(
              "max-h-24 w-full max-w-24 opacity-0 [--_dest-opacity:1]",
              "max-lg:animate-slide-bt-fade-out max-lg:translate-y-full max-lg:[animation-delay:0.4s]",
              "lg:animate-slide-lr-fade-out lg:-translate-x-full lg:[animation-delay:0.4s]",
            )}
          />
          <Image
            src={typescript}
            alt="TypeScript"
            className={cn(
              "max-h-24 w-full max-w-24 opacity-0 [--_dest-opacity:0]",
              "max-lg:animate-slide-bt-fade-in max-lg:translate-y-full max-lg:[animation-delay:0.4s]",
              "lg:animate-slide-lr-fade-in lg:-translate-x-full lg:[animation-delay:0.4s]",
            )}
          />
        </li>
        <li className="grid *:col-span-full *:row-span-full">
          <Image
            src={react}
            alt="React"
            className={cn(
              "max-h-24 w-full max-w-24 opacity-0 [--_dest-opacity:1]",
              "max-lg:animate-slide-bt-fade-out max-lg:translate-y-full max-lg:[animation-delay:0.6s,8s]",
              "lg:animate-slide-lr-fade-out lg:-translate-x-full lg:[animation-delay:0.6s,8s]",
            )}
          />
          <Image
            src={nextjs}
            alt="NextJS"
            className={cn(
              "max-h-24 w-full max-w-24 opacity-0 [--_dest-opacity:0]",
              "max-lg:animate-slide-bt-fade-in max-lg:translate-y-full max-lg:[animation-delay:0.6s,8s]",
              "lg:animate-slide-lr-fade-in lg:-translate-x-full lg:[animation-delay:0.6s,8s]",
            )}
          />
        </li>
        <li className="grid *:col-span-full *:row-span-full">
          <Image
            src={inkscape}
            alt="Inkscape"
            className={cn(
              "max-h-24 w-full max-w-24 opacity-0 [--_dest-opacity:1]",
              "max-lg:animate-slide-bt-fade-out max-lg:translate-y-full max-lg:[animation-delay:0.8s,16s]",
              "lg:animate-slide-lr-fade-out lg:-translate-x-full lg:[animation-delay:0.8s,16s]",
            )}
          />
          <Image
            src={gimp}
            alt="GIMP"
            className={cn(
              "max-h-24 w-full max-w-24 opacity-0 [--_dest-opacity:0]",
              "max-lg:animate-slide-bt-fade-in max-lg:translate-y-full max-lg:[animation-delay:0.8s,16s]",
              "lg:animate-slide-lr-fade-in lg:-translate-x-full lg:[animation-delay:0.8s,16s]",
            )}
          />
        </li>
      </ul>
    </aside>
  );
}

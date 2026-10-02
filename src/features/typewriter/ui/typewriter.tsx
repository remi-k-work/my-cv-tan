// services, features, and other libraries
import { cn } from "@/lib/utils";
import { Option } from "effect";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { typewriterAtom } from "@/features/typewriter/state/typewriter";

// types
interface TypewriterProps {
  fullText: string;
}

export function Typewriter({ fullText }: TypewriterProps) {
  // One atom per text via the family, so that typewriter animates independently
  const typewriter = useAtomValue(typewriterAtom(fullText));

  // The latest emitted text, falling back to the full text before the first emission (which is also the SSR-rendered markup)
  const currText = AsyncResult.value(typewriter).pipe(Option.getOrElse(() => fullText));

  // Whether or not the typewriter is still running
  const isRunning = AsyncResult.isWaiting(typewriter);

  return (
    <p className={cn("mx-auto max-w-[35ch] text-center text-wrap sm:max-w-prose", isRunning && "after:animate-cursor-blink after:content-['▋']")}>{currText}</p>
  );
}

// oxlint-disable react/set-state-in-effect

// react
import { useEffect, useState } from "react";

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

  // The blinking cursor is a client-only flourish: on the server (and the hydration render that must match it)
  // it stays absent, and appears only once the page is interactive — the full text is visible either way
  const [isMounted, setIsMounted] = useState(false);

  // The post-mount render is the point of this gate: it opts the blinking cursor in only once the page is interactive
  useEffect(() => setIsMounted(true), []);

  // The latest emitted text, falling back to the full text before the first emission (which is also the SSR-rendered markup)
  const currText = AsyncResult.value(typewriter).pipe(Option.getOrElse(() => fullText));

  // Whether or not the typewriter is still running
  const isRunning = isMounted && AsyncResult.isWaiting(typewriter);

  return (
    <p
      className={cn(
        "mx-auto min-h-12 max-w-[35ch] text-center text-wrap sm:min-h-auto sm:max-w-prose",
        isRunning && "after:animate-cursor-blink after:content-['▋']"
      )}
    >
      {currText}
    </p>
  );
}

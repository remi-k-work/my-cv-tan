// react
import { useMemo } from "react";

// services, features, and other libraries
import { useAtomValue } from "@effect/atom-react";
import { Option, pipe } from "effect";
import { AsyncResult } from "effect/reactivity";
import { cn } from "@/lib/utils";
import { makeTypewriterAtom } from "@/features/typewriter/state/typewriter";

// types
interface TypeWriterOutputProps {
  fullText: string;
}

export function TypeWriterOutput({ fullText }: TypeWriterOutputProps) {
  // One atom per text instance: each paragraph animates independently and its
  // stream is cancelled automatically on unmount via scope finalizers
  const atom = useMemo(() => makeTypewriterAtom(fullText), [fullText]);
  const result = useAtomValue(atom);

  // The latest emitted text, falling back to the full text before the first
  // emission (which is also the SSR-rendered markup)
  const text = pipe(
    AsyncResult.value(result),
    Option.getOrElse(() => fullText)
  );
  const isRunning = AsyncResult.isWaiting(result);

  return (
    <p
      className={cn("mx-auto max-w-[35ch] text-center text-wrap sm:max-w-prose", isRunning && "after:animate-cursor-blink after:content-['▋']")}
    >
      {text}
    </p>
  );
}

"use client";

// other libraries
import { cn } from "@/lib/utils";
import useTypeWriter from "@/hooks/useTypeWriter";

// types
interface TypeWriterOutputProps {
  fullText: string;
}

export default function TypeWriterOutput({ fullText }: TypeWriterOutputProps) {
  const { elementRef, isRunning } = useTypeWriter(fullText);

  return (
    <p
      ref={elementRef}
      className={cn("mx-auto max-w-[35ch] text-center text-wrap sm:max-w-prose", isRunning && "after:animate-cursor-blink after:content-['▋']")}
    />
  );
}

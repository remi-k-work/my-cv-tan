// components
import { RevealText } from "@/ui/reveal-text";

// types
interface PageTitleProps {
  // The stable page identity heading: it never rotates, so the visible H1 matches the head and twin
  heading: string;
  // The supporting copy may rotate between loads without changing the identity
  eyebrow: string;
  intro: string;
}

export function PageTitle({ heading, eyebrow, intro }: PageTitleProps) {
  return (
    <header className="mx-4 my-3 animate-rise lg:mx-0">
      <p className="inline-grid overflow-clip text-lg tracking-widest text-text-2 uppercase">
        <RevealText reverse>{eyebrow}</RevealText>
      </p>
      <br />
      <h1 className="inline-grid overflow-clip text-3xl uppercase">
        <RevealText>{heading}</RevealText>
      </h1>
      {/* The intro settles into place a beat after the sweeping reveals, layering the hero entrance instead of popping in */}
      <p className="animate-rise [animation-delay:1s]">{intro}</p>
    </header>
  );
}

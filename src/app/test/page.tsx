"use client";

// other libraries
import useIsPortrait from "@/hooks/useIsPortrait";

// components
import TypeWriterOutput from "@/components/TypeWriterOutput";

export default function Page() {
  const isPortrait = useIsPortrait();

  console.log(isPortrait);

  return (
    <>
      Test
      <article className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4">
        <section className="bg-clr-primary-800 rounded-xl p-4">
          <TypeWriterOutput fullText="Would you like me to show you a before/after compiled JS snippet so you can see exactly how TS expands both inline initializers and parameter properties in your current class?" />
        </section>
        <section className="bg-clr-primary-800 rounded-xl p-4">Test</section>
      </article>
    </>
  );
}

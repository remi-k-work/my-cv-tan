// react
import { useRef, useState, useEffect } from "react";

// services, features, and other libraries
import TypeWriter from "@/lib/typewriter";

export function useTypeWriter(fullText: string) {
  // State to track the animation status, causing minimal re-renders
  const [isRunning, setIsRunning] = useState(true);

  // Ref to hold the DOM element
  const elementRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // We check elementRef to make sure the component is still mounted
    if (!elementRef.current) return;

    // Create a new typewriter instance for the given text
    const controller = new AbortController();
    const typewriter = new TypeWriter(controller.signal, (text: string) => {
      if (elementRef.current) elementRef.current.textContent = text;
    });
    typewriter.typeFullText(fullText);

    // Start the typewriter logic
    void typewriter.start(() => {
      // Check if the component is still mounted implicitly by checking the ref
      if (elementRef.current) setIsRunning(false);
    });

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [fullText]);

  return { elementRef, isRunning };
}

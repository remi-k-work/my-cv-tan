// react
import { useEffect, useState } from "react";

// constants
const EXIT_ANIM_DURATION = 3000;

export default function useAnimatedErrors(liveErrorMessages: string[], opts?: { gated?: boolean; show?: boolean }) {
  // The error messages that are currently being displayed
  const [dispErrorMessages, setDispErrorMessages] = useState<string[]>(liveErrorMessages);

  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    setDispErrorMessages((prevDispErrorMessages) => {
      // Add any new live error messages to the presently shown messages right away
      const newLiveErrorMessages = liveErrorMessages.filter((message) => !prevDispErrorMessages.includes(message));

      // Figure out which ones disappeared
      const oldLiveErrorMessages = prevDispErrorMessages.filter((message) => !liveErrorMessages.includes(message));

      // Remove each old live error message after the exit animation is complete
      oldLiveErrorMessages.forEach((oldLiveErrorMessage) => {
        const timeoutId = setTimeout(() => {
          setDispErrorMessages((prevDispErrorMessages) => prevDispErrorMessages.filter((prevDispErrorMessage) => prevDispErrorMessage !== oldLiveErrorMessage));
        }, EXIT_ANIM_DURATION);
        timeoutIds.push(timeoutId);
      });

      if (newLiveErrorMessages.length > 0) {
        return [...prevDispErrorMessages, ...newLiveErrorMessages];
      }

      return prevDispErrorMessages;
    });

    return () => {
      timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [liveErrorMessages]);

  // Optional: gated rendering (e.g., client errors only after touch)
  if (opts?.gated && !opts.show) return [];

  return dispErrorMessages.map((message) => ({ message, isShowing: liveErrorMessages.includes(message) }));
}

// react
import { useEffect, useState } from "react";

// Determine whether the current screen orientation is portrait
export default function useIsPortrait() {
  const [isPortrait, setIsPortrait] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    const mql = window.matchMedia("(orientation: portrait)");

    // Set initial value on mount
    setIsPortrait(mql.matches);

    // Subscribe to changes
    mql.addEventListener("change", (ev: MediaQueryListEvent) => setIsPortrait(ev.matches), { signal: controller.signal });

    return () => controller.abort();
  }, []);

  return isPortrait;
}

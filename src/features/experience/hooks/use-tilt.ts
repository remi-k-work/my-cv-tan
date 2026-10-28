// oxlint-disable react/set-state-in-effect — reading window/matchMedia after mount to decide whether to attach
// pointer handlers; this can only run after mount (it's unavailable during SSR), so the one-off setState in this
// mount effect is intentional and matches the mount gate in features/typewriter/ui/typewriter.tsx

// react
import { useEffect, useState } from "react";

// services, features, and other libraries
import { useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";

// types
import type { PointerEvent } from "react";

// constants
import { SPRINGS } from "@/lib/motion-tokens";

// Tilt needs a precise pointer: a coarse one (touch) is busy dragging the carousel, where springs would fight Embla
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

// How far the card may tip, in degrees, and the depth of the 3D space it tips in
const TILT_MAX_DEG = 6;
const TILT_PERSPECTIVE_PX = 1000;

// Peak opacity of the sheen that tracks the pointer across the card
const GLARE_OPACITY = 0.35;

// Interactive card tilt: the card leans away from the pointer with gentle spring physics
// The tilt is a pure enhancement — the motion values start neutral, so the server-rendered
// markup is identical, and the handlers are not attached at all for coarse pointers
export function useTilt() {
  // Pointer position within the card as offsets from its center, from -0.5 (top/left edge) to +0.5 (bottom/right edge)
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  // The pointer's side of the card leans back into the screen, smoothed into a soft physical tilt
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [TILT_MAX_DEG, -TILT_MAX_DEG]), SPRINGS.gentle);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-TILT_MAX_DEG, TILT_MAX_DEG]), SPRINGS.gentle);

  // The sheen follows the pointer and fades in while it hovers the card
  const glareX = useTransform(pointerX, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(pointerY, [-0.5, 0.5], ["0%", "100%"]);
  const glareImage = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, color-mix(in oklab, var(--accent) 45%, transparent), transparent 65%)`;
  const glareOpacity = useSpring(0, SPRINGS.gentle);

  // Whether the pointer is precise enough for tilt; it starts false so the SSR/hydration render emits no
  // pointer handlers (matching the server markup); the real value is read after mount: reading it during the
  // initial render would freeze the SSR value (false) forever, so tilt would never work on the client
  const [isFinePointer, setIsFinePointer] = useState(false);

  useEffect(() => {
    setIsFinePointer(typeof window !== "undefined" && window.matchMedia(FINE_POINTER_QUERY).matches);
  }, []);

  function handlePointerMove(ev: PointerEvent<HTMLElement>) {
    // A held button means the pointer is dragging the carousel; the tilt must not fight it
    if (ev.buttons !== 0) return;

    const rect = ev.currentTarget.getBoundingClientRect();
    pointerX.set((ev.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((ev.clientY - rect.top) / rect.height - 0.5);
    glareOpacity.set(GLARE_OPACITY);
  }

  function handlePointerLeave() {
    pointerX.set(0);
    pointerY.set(0);
    glareOpacity.set(0);
  }

  return {
    // Fed to a motion element's style; transformPerspective bakes the 3D space into the element's own transform
    style: { rotateX, rotateY, transformPerspective: TILT_PERSPECTIVE_PX },
    handlers: isFinePointer ? { onPointerMove: handlePointerMove, onPointerLeave: handlePointerLeave } : undefined,
    glareStyle: { backgroundImage: glareImage, opacity: glareOpacity },
  } as const;
}

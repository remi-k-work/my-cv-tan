// react
import { useState } from "react";

// services, features, and other libraries
import { useMotionValue, useSpring, useTransform } from "motion/react";

// types
import type { PointerEvent } from "react";

// constants
import { SPRINGS } from "@/lib/motion-tokens";

// Tilt needs a precise pointer: a coarse one (touch) is busy dragging the carousel, where springs would fight Embla
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

// How far the card may tip, in degrees, and the depth of the 3D space it tips in
const TILT_MAX_DEG = 6;
const TILT_PERSPECTIVE_PX = 1000;

// Interactive card tilt: the card leans away from the pointer with gentle spring physics
// The tilt is a pure enhancement — the motion values start neutral, so the server-rendered
// markup is identical, and the handlers are not attached at all for coarse pointers
export function useTilt() {
  // Pointer position within the card as offsets from its center, from -0.5 (top/left edge) to +0.5 (bottom/right edge)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // The pointer's side of the card leans back into the screen, smoothed into a soft physical tilt
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [TILT_MAX_DEG, -TILT_MAX_DEG]), SPRINGS.gentle);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-TILT_MAX_DEG, TILT_MAX_DEG]), SPRINGS.gentle);

  // Whether the pointer is precise enough for tilt; false during SSR, where there is nothing to tilt anyway
  const [isFinePointer] = useState(() => typeof window !== "undefined" && window.matchMedia(FINE_POINTER_QUERY).matches);

  function handlePointerMove(ev: PointerEvent<HTMLElement>) {
    // A held button means the pointer is dragging the carousel; the tilt must not fight it
    if (ev.buttons !== 0) return;

    const rect = ev.currentTarget.getBoundingClientRect();
    x.set((ev.clientX - rect.left) / rect.width - 0.5);
    y.set((ev.clientY - rect.top) / rect.height - 0.5);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return {
    // Fed to a motion element's style; transformPerspective bakes the 3D space into the element's own transform
    style: { rotateX, rotateY, transformPerspective: TILT_PERSPECTIVE_PX },
    handlers: isFinePointer ? { onPointerMove: handlePointerMove, onPointerLeave: handlePointerLeave } : undefined,
  } as const;
}

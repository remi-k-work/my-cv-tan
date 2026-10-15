// react
import { Suspense, lazy } from "react";

// tanstack
import { ClientOnly } from "@tanstack/react-router";
import { useGT } from "gt-tanstack-start";

// services, features, and other libraries
import { motion } from "motion/react";
import { useTilt } from "@/features/experience/hooks";

// components
const ReactLeaflet = lazy(() => import("./react-leaflet"));

// assets
import avatar from "@/assets/avatar.jpg";

export function ContactMap() {
  const gt = useGT();

  // The address card leans away from the pointer with the same gentle physics as the experience slides
  const { style, handlers, glareStyle } = useTilt();

  // Leaflet touches window at import time, so it must never be evaluated on the server
  // ClientOnly gates SSR, Suspense covers the client-side chunk download
  const fallback = <div className="size-full min-h-96" />;

  return (
    <div className="relative z-0 mx-auto size-full max-w-4xl">
      <ClientOnly fallback={fallback}>
        <Suspense fallback={fallback}>
          <ReactLeaflet />
        </Suspense>
      </ClientOnly>
      {/* The card floats on its own element, so the CSS float and the pointer tilt never fight over one transform */}
      <motion.div className="absolute inset-e-4 top-4" style={style} {...handlers}>
        <div className="animate-float rounded-xl bg-surface-1/90 p-3 text-sm select-none [animation-delay:-3.5s]">
          <img src={avatar} width={288} height={288} alt="Portrait of Remi" className="max-h-32 w-full object-cover" loading="lazy" />
          <p className="mt-4">Remi</p>
          <p className="text-text-2">Broniewskiego 24</p>
          <p className="text-text-2">35-206 Rzeszów</p>
          <p className="mb-4 text-text-2">{gt("Poland")}</p>
          <a href="mailto:remi.k.work@proton.me" className="underline">
            remi.k.work@proton.me
          </a>
        </div>
        <motion.div className="pointer-events-none absolute inset-0 rounded-xl" style={glareStyle} aria-hidden="true" />
      </motion.div>
    </div>
  );
}

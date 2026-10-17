// react
import { Suspense, lazy } from "react";
import { preconnect } from "react-dom";

// tanstack
import { ClientOnly } from "@tanstack/react-router";

// services, features, and other libraries
import { useGT } from "gt-tanstack-start";
import { motion } from "motion/react";
import { useTilt } from "@/features/experience/hooks/use-tilt";

// components
const ReactLeaflet = lazy(() => import("./react-leaflet"));

// assets
import avatar from "@/assets/avatar.jpg";

// Leaflet touches window at import time, so it must never be evaluated on the server
// ClientOnly gates SSR, Suspense covers the client-side chunk download; hoisted so every render reuses one element
const mapFallback = <div className="size-full min-h-96" />;

export function ContactMap() {
  const gt = useGT();

  // Warm the tile origins Leaflet round-robins across, so DNS+TLS overlap with the chunk download instead of delaying the first tile paint
  preconnect("https://a.tile.openstreetmap.org");
  preconnect("https://b.tile.openstreetmap.org");
  preconnect("https://c.tile.openstreetmap.org");

  // The address card leans away from the pointer with the same gentle physics as the experience slides
  const { style, handlers, glareStyle } = useTilt();

  return (
    <div className="relative z-0 mx-auto size-full max-w-4xl">
      <ClientOnly fallback={mapFallback}>
        <Suspense fallback={mapFallback}>
          <ReactLeaflet />
        </Suspense>
      </ClientOnly>
      {/* The card floats on its own element, so the CSS float and the pointer tilt never fight over one transform */}
      <motion.div className="absolute inset-e-4 top-4" style={style} {...handlers}>
        <div className="animate-float rounded-xl bg-surface-1/90 p-3 text-sm select-none [animation-delay:-3.5s]">
          <img src={avatar} width={288} height={288} alt={gt("Portrait of Remi")} className="max-h-32 w-full object-cover" loading="lazy" />
          {/* The owner's contact information: exactly what the address element is for */}
          <address className="not-italic">
            <p className="mt-4">Remi</p>
            <p className="text-text-2">Broniewskiego 24</p>
            <p className="text-text-2">35-206 Rzeszów</p>
            <p className="mb-4 text-text-2">{gt("Poland")}</p>
            <a href="mailto:remi.k.work@proton.me" className="underline">
              remi.k.work@proton.me
            </a>
          </address>
        </div>
        <motion.div className="pointer-events-none absolute inset-0 rounded-xl" style={glareStyle} aria-hidden="true" />
      </motion.div>
    </div>
  );
}

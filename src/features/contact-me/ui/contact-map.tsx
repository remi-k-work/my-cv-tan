// react
import { Suspense, lazy } from "react";
import { preconnect } from "react-dom";

// tanstack
import { ClientOnly } from "@tanstack/react-router";

// components
const ReactLeaflet = lazy(() => import("./react-leaflet"));
import { ContactAddressCard } from "./contact-address-card";

// Leaflet touches window at import time, so it must never be evaluated on the server
// ClientOnly gates SSR, Suspense covers the client-side chunk download; hoisted so every render reuses one element
const mapFallback = <div className="size-full min-h-96" />;

export function ContactMap() {
  // Warm the one tile origin the map actually loads from
  preconnect("https://tile.openstreetmap.org");

  return (
    <div className="relative z-0 mx-auto size-full max-w-4xl">
      <ClientOnly fallback={mapFallback}>
        <Suspense fallback={mapFallback}>
          <ReactLeaflet />
        </Suspense>
      </ClientOnly>
      <ContactAddressCard />
    </div>
  );
}

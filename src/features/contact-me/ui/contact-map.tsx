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
  // Warm the tile origins Leaflet round-robins across, so DNS+TLS overlap with the chunk download
  // instead of delaying the first tile paint; issued during render (React 19) so the hints are sent
  // as early as possible; react dedupes identical calls across renders; no effect needed — this is a
  // resource hint, not external synchronization
  preconnect("https://a.tile.openstreetmap.org");
  preconnect("https://b.tile.openstreetmap.org");
  preconnect("https://c.tile.openstreetmap.org");

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

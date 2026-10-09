// react
import { Suspense, lazy } from "react";

// tanstack
import { ClientOnly } from "@tanstack/react-router";
import { useGT } from "gt-tanstack-start";

// components
const ReactLeaflet = lazy(() => import("./react-leaflet"));

// assets
import avatar from "@/assets/avatar.jpg";

export function ContactMap() {
  const gt = useGT();
  // Leaflet touches window at import time, so it must never be evaluated on the server:
  // ClientOnly gates SSR, Suspense covers the client-side chunk download.
  const fallback = <div className="size-full min-h-96" />;

  return (
    <div className="relative z-0 mx-auto size-full max-w-4xl">
      <ClientOnly fallback={fallback}>
        <Suspense fallback={fallback}>
          <ReactLeaflet />
        </Suspense>
      </ClientOnly>
      <div className="absolute inset-e-4 top-4 bg-surface-1/90 p-3 text-sm">
        <img src={avatar} width={288} height={288} alt="Avatar" className="max-h-32 w-full object-cover" loading="lazy" />
        <p className="mt-4">Remi</p>
        <p className="text-text-2">Broniewskiego 24</p>
        <p className="text-text-2">35-206 Rzeszów</p>
        <p className="mb-4 text-text-2">{gt("Poland")}</p>
        <a href="mailto:remi.k.work@proton.me" className="underline">
          remi.k.work@proton.me
        </a>
      </div>
    </div>
  );
}

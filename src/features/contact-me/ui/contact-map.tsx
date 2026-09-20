// react
import { Suspense, lazy } from "react";

// assets
import avatar from "@/assets/avatar.jpg";

const ReactLeaflet = lazy(() => import("./react-leaflet"));

// types
import type { LocalizedContent } from "@/types/shared";

interface ContactMapProps {
  localizedContent: LocalizedContent;
}

export function ContactMap({ localizedContent }: ContactMapProps) {
  return (
    <div className="relative z-0 mx-auto size-full max-w-4xl">
      <Suspense fallback={<div className="size-full min-h-64 animate-pulse rounded-xl" />}>
        <ReactLeaflet localizedContent={localizedContent} />
      </Suspense>
      <div className="absolute inset-e-4 top-4 bg-background/90 p-3 text-sm">
        <img src={avatar} width={288} height={288} alt="Avatar" className="max-h-32 w-full object-cover" loading="lazy" />
        <p className="mt-4">Remi</p>
        <p className="text-clr-primary-200">Broniewskiego 24</p>
        <p className="text-clr-primary-200">35-206 Rzeszów</p>
        <p className="mb-4 text-clr-primary-200">{localizedContent["contactMap"]["poland"]}</p>
        <a href="mailto:remi.k.work@proton.me" className="underline">
          remi.k.work@proton.me
        </a>
      </div>
    </div>
  );
}

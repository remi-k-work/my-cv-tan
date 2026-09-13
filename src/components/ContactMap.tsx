"use client";

// next
import dynamic from "next/dynamic";
import Image from "next/image";

// components
const ReactLeaflet = dynamic(() => import("@/components/ReactLeaflet"), { ssr: false });

// assets
import avatar from "@/assets/avatar.jpg";

// types
import type { LocalizedContent } from "@/types/shared";

interface ContactMapProps {
  localizedContent: LocalizedContent;
}

export default function ContactMap({ localizedContent }: ContactMapProps) {
  return (
    <div className="relative z-0 mx-auto size-full max-w-4xl">
      <ReactLeaflet localizedContent={localizedContent} />
      <div className="bg-background/90 absolute inset-e-4 top-4 p-3 text-sm">
        <Image src={avatar} alt="Avatar" className="max-h-32 w-full object-cover" />
        <p className="mt-4">Remi</p>
        <p className="text-clr-primary-200">Broniewskiego 24</p>
        <p className="text-clr-primary-200">35-206 Rzeszów</p>
        <p className="text-clr-primary-200 mb-4">{localizedContent["contactMap"]["poland"]}</p>
        <a href="mailto:remi.k.work@proton.me" className="underline">
          remi.k.work@proton.me
        </a>
      </div>
    </div>
  );
}

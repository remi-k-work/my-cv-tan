// services, features, and other libraries
import { cn } from "@/lib/utils";
import { useGT } from "gt-tanstack-start";
import { motion } from "motion/react";
import { useTilt } from "@/features/experience/hooks/use-tilt";

// components
import { PageSection } from "@/ui/page-section";

// assets
import artcom from "@/assets/my-certificates-artcom.webp";
import alcc from "@/assets/my-certificates-alcc.webp";
import prattOrig from "@/assets/my-certificates-pratt-orig.webp";
import prattTrans from "@/assets/my-certificates-pratt-trans.webp";

// types
interface CertificateSheetProps {
  src: string;
  width: number;
  height: number;
  alt: string;
}

// constants
const CERTIFICATES = [
  { src: artcom, width: 1222, height: 870, alt: "ARTCOM" },
  { src: alcc, width: 1222, height: 870, alt: "ALCC" },
  { src: prattOrig, width: 1222, height: 870, alt: "Pratt" },
  { src: prattTrans, width: 1694, height: 870, alt: "Pratt" },
] as const satisfies ReadonlyArray<CertificateSheetProps>;

// One certificate sheet: rises in on scroll, then leans away from the pointer with the same gentle physics as the
// experience slides, the accent sheen tracking the pointer across the paper; pure enhancement — the sheet is fully
// visible in the SSR markup, and tilt handlers are only attached for fine pointers
function CertificateSheet({ src, width, height, alt }: CertificateSheetProps) {
  const { style, handlers, glareStyle } = useTilt();

  return (
    <div className="scroll-rise">
      {/* Only the shadow transitions, never the transform: the tilt spring owns that and must not be smoothed over */}
      <motion.div
        className={cn(
          "relative overflow-clip rounded-xl transition-shadow duration-300",
          "hover:shadow-[0_0_16px_color-mix(in_oklab,var(--accent)_35%,transparent)]"
        )}
        style={style}
        {...handlers}
      >
        <img src={src} width={width} height={height} alt={alt} loading="lazy" className="h-auto w-full" />
        <motion.div className="pointer-events-none absolute inset-0 rounded-xl" style={glareStyle} aria-hidden="true" />
      </motion.div>
    </div>
  );
}

export function Certificates() {
  const gt = useGT();

  return (
    <PageSection title={gt("My Certificates")}>
      <a className="space-y-4" href="/my-certificates.pdf" target="_blank" rel="noopener noreferrer" aria-label={gt("View Certificates PDF")}>
        {CERTIFICATES.map((cert) => (
          <CertificateSheet key={cert.src} {...cert} />
        ))}
      </a>
    </PageSection>
  );
}
